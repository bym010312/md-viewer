/**
 * Editor ↔ preview scroll synchronization based on source line mapping.
 *
 * The preview marks every block with `data-source-line` (see markdown.ts).
 * For each such line we know two vertical positions — where it starts in the
 * editor and where its block starts in the preview — and interpolate linearly
 * between neighboring anchors. Unlike a plain scroll-ratio mapping, this stays
 * aligned when images, code blocks or tables make the two panes very different
 * in height.
 */

/** A pair of vertical scroll offsets (px) that show the same source position. */
export interface ScrollAnchor {
  editor: number;
  preview: number;
}

export type ScrollPane = keyof ScrollAnchor;

/** The minimum the sync needs from the editor, so this module stays independent of CodeMirror. */
export interface EditorScrollAdapter {
  scrollElement: HTMLElement;
  /** Element whose size changes when editor content or wrapping changes. */
  contentElement: HTMLElement;
  /** Scroll offset that puts the given 1-based line at the top, or null if the line doesn't exist. */
  getLineTop: (line: number) => number | null;
}

export interface SourceLinePosition {
  line: number;
  top: number;
}

/**
 * Builds anchors sorted by position, keeping only those that increase in both
 * panes so interpolation is monotonic. Documents always align at the top and
 * at the end of their content.
 */
export function buildScrollAnchors(
  previewPositions: readonly SourceLinePosition[],
  getEditorLineTop: (line: number) => number | null,
  contentHeights: ScrollAnchor,
): ScrollAnchor[] {
  const anchors: ScrollAnchor[] = [{ editor: 0, preview: 0 }];
  const sortedPositions = [...previewPositions].sort((a, b) => a.line - b.line || a.top - b.top);

  let previousLine = 0;
  for (const { line, top } of sortedPositions) {
    // Nested blocks (list > item > paragraph) share a start line; the outermost comes first.
    if (line === previousLine) continue;
    previousLine = line;

    const editorTop = getEditorLineTop(line);
    const last = anchors[anchors.length - 1];
    if (editorTop === null || editorTop < last.editor || top < last.preview) continue;
    anchors.push({ editor: editorTop, preview: top });
  }

  const last = anchors[anchors.length - 1];
  if (contentHeights.editor >= last.editor && contentHeights.preview >= last.preview) {
    anchors.push(contentHeights);
  }
  return anchors;
}

/** Maps a scroll offset in one pane to the other by interpolating between the surrounding anchors. */
export function mapScrollOffset(anchors: readonly ScrollAnchor[], from: ScrollPane, offset: number): number {
  const to: ScrollPane = from === 'editor' ? 'preview' : 'editor';
  if (anchors.length === 0) return 0;
  if (offset <= anchors[0][from]) return anchors[0][to];

  const last = anchors[anchors.length - 1];
  if (offset >= last[from]) return last[to];

  // Binary search for the last anchor at or before the offset.
  let low = 0;
  let high = anchors.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (anchors[middle][from] <= offset) low = middle;
    else high = middle;
  }

  const start = anchors[low];
  const end = anchors[high];
  const span = end[from] - start[from];
  const progress = span === 0 ? 0 : (offset - start[from]) / span;
  return start[to] + progress * (end[to] - start[to]);
}

function getMaxScrollTop(element: HTMLElement): number {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

function collectPreviewPositions(previewElement: HTMLElement): SourceLinePosition[] {
  const containerTop = previewElement.getBoundingClientRect().top - previewElement.scrollTop;
  const positions: SourceLinePosition[] = [];

  for (const element of previewElement.querySelectorAll<HTMLElement>('[data-source-line]')) {
    const line = Number(element.dataset.sourceLine);
    if (!Number.isFinite(line)) continue;
    // markdown-it puts a fence's attributes on <code>; the visible block is its <pre>.
    const block = element.tagName === 'CODE' && element.parentElement?.tagName === 'PRE' ? element.parentElement : element;
    positions.push({ line, top: block.getBoundingClientRect().top - containerTop });
  }
  return positions;
}

export interface ScrollSyncController {
  /** Marks anchors stale, e.g. after the document content changed. */
  invalidate: () => void;
  destroy: () => void;
}

// Events that mean the user is operating this pane directly. Only the pane the
// user last operated drives the sync, so the programmatic scroll we apply to the
// other pane can never echo back (no editor → preview → editor loop).
const USER_INTENT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

export function createScrollSync(editor: EditorScrollAdapter, previewElement: HTMLElement): ScrollSyncController {
  const elements: Record<ScrollPane, HTMLElement> = { editor: editor.scrollElement, preview: previewElement };
  let activePane: ScrollPane | null = null;
  let anchors: ScrollAnchor[] | null = null;
  let frameId: number | null = null;

  const getAnchors = (): ScrollAnchor[] => {
    anchors ??= buildScrollAnchors(collectPreviewPositions(previewElement), editor.getLineTop, {
      editor: editor.scrollElement.scrollHeight,
      preview: previewElement.scrollHeight,
    });
    return anchors;
  };

  const syncFromActivePane = () => {
    frameId = null;
    if (!activePane) return;

    const source = elements[activePane];
    const target = elements[activePane === 'editor' ? 'preview' : 'editor'];
    const targetMax = getMaxScrollTop(target);

    // At the very bottom, show the end of the other pane too, even if the anchors
    // don't line up exactly there (the last lines rarely have equal heights).
    const isAtBottom = source.scrollTop >= getMaxScrollTop(source) - 1;
    const mappedTop = isAtBottom ? targetMax : mapScrollOffset(getAnchors(), activePane, source.scrollTop);
    const nextTop = Math.min(Math.max(mappedTop, 0), targetMax);

    // Instant, not smooth: smooth scrolling lags behind continuous scroll events.
    if (Math.abs(target.scrollTop - nextTop) >= 1) target.scrollTop = nextTop;
  };

  const cleanups: (() => void)[] = [];

  for (const pane of ['editor', 'preview'] as const) {
    const element = elements[pane];
    const markActive = () => {
      activePane = pane;
    };
    const handleScroll = () => {
      if (activePane !== pane || frameId !== null) return;
      // At most one sync per frame, without touching React state.
      frameId = requestAnimationFrame(syncFromActivePane);
    };

    for (const eventName of USER_INTENT_EVENTS) {
      element.addEventListener(eventName, markActive, { passive: true });
    }
    element.addEventListener('scroll', handleScroll, { passive: true });
    cleanups.push(() => {
      for (const eventName of USER_INTENT_EVENTS) element.removeEventListener(eventName, markActive);
      element.removeEventListener('scroll', handleScroll);
    });
  }

  // Content edits, late-loading images, font loading and panel resizes all move
  // blocks; any of them changes one of these element sizes.
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(() => {
      anchors = null;
    });
    resizeObserver.observe(editor.contentElement);
    resizeObserver.observe(editor.scrollElement);
    resizeObserver.observe(previewElement);
    if (previewElement.firstElementChild) resizeObserver.observe(previewElement.firstElementChild);
    cleanups.push(() => resizeObserver.disconnect());
  }

  return {
    invalidate: () => {
      anchors = null;
    },
    destroy: () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      cleanups.forEach((cleanup) => cleanup());
    },
  };
}
