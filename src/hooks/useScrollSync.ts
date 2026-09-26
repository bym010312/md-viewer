import { useEffect, useRef, type RefObject } from 'react';
import type { MarkdownEditorHandle } from '../components/editor/MarkdownEditor';
import { createScrollSync, type ScrollSyncController } from '../lib/scrollSync';

interface ScrollSyncOptions {
  /** True only when the setting is on and both panes are visible (desktop split view). */
  isActive: boolean;
  editorRef: RefObject<MarkdownEditorHandle | null>;
  previewRef: RefObject<HTMLDivElement | null>;
  markdownContent: string;
}

export function useScrollSync({ isActive, editorRef, previewRef, markdownContent }: ScrollSyncOptions): void {
  const controllerRef = useRef<ScrollSyncController | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const editorAdapter = editorRef.current?.getScrollAdapter();
    const previewElement = previewRef.current;
    if (!editorAdapter || !previewElement) return;

    const controller = createScrollSync(editorAdapter, previewElement);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [isActive, editorRef, previewRef]);

  // Line numbers can shift without any element changing size, so edits always invalidate the anchors.
  useEffect(() => {
    controllerRef.current?.invalidate();
  }, [markdownContent]);
}
