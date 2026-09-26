import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarkdownEditorHandle } from '../components/editor/MarkdownEditor';
import { useScrollSync } from './useScrollSync';

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

let frames: FrameRequestCallback[] = [];
let editorPane: HTMLElement;
let previewPane: HTMLElement;
let editorRef: { current: MarkdownEditorHandle | null };
let previewRef: { current: HTMLDivElement | null };

function userScrollEditor(scrollTop: number) {
  editorPane.dispatchEvent(new Event('wheel'));
  editorPane.scrollTop = scrollTop;
  const pending = frames;
  frames = [];
  pending.forEach((callback) => callback(0));
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => {});

  editorPane = createPane(1000, 500);
  previewPane = createPane(2000, 500) as HTMLDivElement;
  editorRef = {
    current: {
      applyFormat: () => {},
      focus: () => {},
      getScrollAdapter: () => ({ scrollElement: editorPane, contentElement: editorPane, getLineTop: () => null }),
    },
  };
  previewRef = { current: previewPane as HTMLDivElement };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useScrollSync', () => {
  it('keeps the panes independent when sync is off', () => {
    renderHook(() => useScrollSync({ isActive: false, editorRef, previewRef, markdownContent: '' }));
    userScrollEditor(300);
    expect(previewPane.scrollTop).toBe(0);
  });

  it('syncs while active and stops when leaving split view, without duplicate listeners', () => {
    const addListener = vi.spyOn(editorPane, 'addEventListener');
    const { rerender } = renderHook(({ isActive }) => useScrollSync({ isActive, editorRef, previewRef, markdownContent: '' }), {
      initialProps: { isActive: true },
    });

    userScrollEditor(250);
    expect(previewPane.scrollTop).toBeGreaterThan(0);

    // e.g. switching to Editor only
    rerender({ isActive: false });
    const previewTopBefore = previewPane.scrollTop;
    userScrollEditor(0);
    expect(previewPane.scrollTop).toBe(previewTopBefore);

    // Back to Split: works again, and only one scroll listener was ever active per activation.
    rerender({ isActive: true });
    userScrollEditor(500);
    expect(previewPane.scrollTop).toBe(1500);
    const scrollListenerCount = addListener.mock.calls.filter(([eventName]) => eventName === 'scroll').length;
    expect(scrollListenerCount).toBe(2);
  });

  it('does not move either pane on its own when activated', () => {
    renderHook(() => useScrollSync({ isActive: true, editorRef, previewRef, markdownContent: '' }));
    expect(editorPane.scrollTop).toBe(0);
    expect(previewPane.scrollTop).toBe(0);
    expect(frames).toHaveLength(0);
  });
});
