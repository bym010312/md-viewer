import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildScrollAnchors, createScrollSync, mapScrollOffset, type EditorScrollAdapter } from './scrollSync';

const LINE_HEIGHT = 20;
const editorLineTop = (line: number) => (line - 1) * LINE_HEIGHT;

describe('buildScrollAnchors', () => {
  it('pairs editor and preview positions of the same source line', () => {
    const anchors = buildScrollAnchors(
      [
        { line: 11, top: 200 },
        { line: 21, top: 1200 },
      ],
      editorLineTop,
      { editor: 2000, preview: 3000 },
    );
    expect(anchors).toEqual([
      { editor: 0, preview: 0 },
      { editor: 200, preview: 200 },
      { editor: 400, preview: 1200 },
      { editor: 2000, preview: 3000 },
    ]);
  });

  it('keeps the outermost of nested blocks and drops out-of-order positions', () => {
    const anchors = buildScrollAnchors(
      [
        { line: 5, top: 100 },
        { line: 5, top: 110 }, // list item inside the list on the same line
        { line: 8, top: 90 }, // would make the mapping go backwards
        { line: 9, top: 300 },
      ],
      editorLineTop,
      { editor: 1000, preview: 1000 },
    );
    expect(anchors.map((anchor) => anchor.preview)).toEqual([0, 100, 300, 1000]);
  });

  it('skips lines that no longer exist in the editor', () => {
    const anchors = buildScrollAnchors([{ line: 99, top: 500 }], (line) => (line > 10 ? null : editorLineTop(line)), {
      editor: 200,
      preview: 800,
    });
    expect(anchors).toEqual([
      { editor: 0, preview: 0 },
      { editor: 200, preview: 800 },
    ]);
  });
});

describe('mapScrollOffset', () => {
  const anchors = [
    { editor: 0, preview: 0 },
    { editor: 200, preview: 200 },
    { editor: 400, preview: 1200 },
    { editor: 2000, preview: 3000 },
  ];

  it('lands exactly on anchors', () => {
    expect(mapScrollOffset(anchors, 'editor', 400)).toBe(1200);
    expect(mapScrollOffset(anchors, 'preview', 1200)).toBe(400);
  });

  it('interpolates between anchors instead of using the overall scroll ratio', () => {
    // Halfway between line 11 and line 21 in the editor is halfway between their preview blocks.
    expect(mapScrollOffset(anchors, 'editor', 300)).toBe(700);
    expect(mapScrollOffset(anchors, 'preview', 700)).toBe(300);
  });

  it('clamps outside the anchor range', () => {
    expect(mapScrollOffset(anchors, 'editor', -50)).toBe(0);
    expect(mapScrollOffset(anchors, 'editor', 5000)).toBe(3000);
  });
});

// Fake scroll container. Setting scrollTop fires the scroll event synchronously,
// which is harsher than browsers (async) for detecting feedback loops.
function createPane(scrollHeight: number, clientHeight: number): HTMLElement {
  const element = document.createElement('div');
  let scrollTop = 0;
  Object.defineProperties(element, {
    scrollHeight: { value: scrollHeight },
    clientHeight: { value: clientHeight },
    scrollTop: {
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = Math.min(Math.max(value, 0), scrollHeight - clientHeight);
        element.dispatchEvent(new Event('scroll'));
      },
    },
  });
  element.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  return element;
}

function addPreviewBlock(preview: HTMLElement, line: number, offsetTop: number) {
  const block = document.createElement('h2');
  block.dataset.sourceLine = String(line);
  block.getBoundingClientRect = () => ({ top: offsetTop - preview.scrollTop }) as DOMRect;
  preview.appendChild(block);
}

describe('createScrollSync', () => {
  let frames: FrameRequestCallback[] = [];
  const flushFrames = () => {
    const pending = frames;
    frames = [];
    pending.forEach((callback) => callback(0));
  };

  let editorPane: HTMLElement;
  let previewPane: HTMLElement;
  let editorAdapter: EditorScrollAdapter;

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal('cancelAnimationFrame', () => {});

    editorPane = createPane(2000, 500);
    previewPane = createPane(3000, 500);
    addPreviewBlock(previewPane, 11, 200);
    addPreviewBlock(previewPane, 21, 1200);
    editorAdapter = { scrollElement: editorPane, contentElement: editorPane, getLineTop: editorLineTop };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function userScroll(pane: HTMLElement, scrollTop: number) {
    pane.dispatchEvent(new Event('wheel'));
    pane.scrollTop = scrollTop;
    flushFrames();
  }

  it('scrolls the preview to the block matching the editor position', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    userScroll(editorPane, 400);
    expect(previewPane.scrollTop).toBe(1200);
    sync.destroy();
  });

  it('scrolls the editor when the user scrolls the preview', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    userScroll(previewPane, 700);
    expect(editorPane.scrollTop).toBe(300);
    sync.destroy();
  });

  it('does not echo the programmatic scroll back to the source pane', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    const editorScrollSetter = vi.fn();
    userScroll(editorPane, 410);

    // Watch for any further writes to the editor while the preview's scroll event is processed.
    editorPane.addEventListener('scroll', editorScrollSetter);
    flushFrames();
    flushFrames();

    expect(editorPane.scrollTop).toBe(410);
    expect(editorScrollSetter).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
    sync.destroy();
  });

  it('switches the source when the user starts operating the other pane', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    userScroll(editorPane, 400);
    userScroll(previewPane, 200);
    expect(editorPane.scrollTop).toBe(200);
    sync.destroy();
  });

  it('shows the end of the other pane when scrolled to the bottom', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    userScroll(editorPane, 1500);
    expect(previewPane.scrollTop).toBe(2500);
    sync.destroy();
  });

  it('stops syncing after destroy', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    sync.destroy();
    userScroll(editorPane, 400);
    expect(previewPane.scrollTop).toBe(0);
  });

  it('uses fresh positions after invalidate', () => {
    const sync = createScrollSync(editorAdapter, previewPane);
    userScroll(editorPane, 400);
    expect(previewPane.scrollTop).toBe(1200);

    // An image above loaded and pushed the block down.
    previewPane.replaceChildren();
    addPreviewBlock(previewPane, 11, 200);
    addPreviewBlock(previewPane, 21, 1600);
    sync.invalidate();
    userScroll(editorPane, 0);
    userScroll(editorPane, 400);
    expect(previewPane.scrollTop).toBe(1600);
    sync.destroy();
  });
});
