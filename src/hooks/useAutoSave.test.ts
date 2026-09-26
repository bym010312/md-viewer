import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT_STORAGE_KEY } from '../constants';
import { createDocument } from '../lib/storage';
import type { MarkdownDocument } from '../types';
import { useAutoSave } from './useAutoSave';

function storedContent(): string | undefined {
  const raw = localStorage.getItem(DOCUMENT_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as MarkdownDocument).content : undefined;
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useAutoSave', () => {
  it('debounces saving and only reports "saved" after writing', () => {
    const initial = createDocument('Doc', 'a');
    const { result, rerender } = renderHook(({ markdownDocument }) => useAutoSave(markdownDocument, 400), {
      initialProps: { markdownDocument: initial },
    });
    expect(result.current.saveStatus).toBe('saved');

    rerender({ markdownDocument: { ...initial, content: 'ab' } });
    rerender({ markdownDocument: { ...initial, content: 'abc' } });
    expect(result.current.saveStatus).toBe('saving');
    expect(storedContent()).toBeUndefined();

    act(() => vi.advanceTimersByTime(399));
    expect(storedContent()).toBeUndefined();

    act(() => vi.advanceTimersByTime(1));
    expect(storedContent()).toBe('abc');
    expect(result.current.saveStatus).toBe('saved');
  });

  it('saves immediately with saveNow', () => {
    const initial = createDocument('Doc', 'a');
    const { result, rerender } = renderHook(({ markdownDocument }) => useAutoSave(markdownDocument), {
      initialProps: { markdownDocument: initial },
    });
    rerender({ markdownDocument: { ...initial, content: 'changed' } });

    act(() => result.current.saveNow());
    expect(storedContent()).toBe('changed');
    expect(result.current.saveStatus).toBe('saved');
  });

  it('reports "unsaved" when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const initial = createDocument('Doc', 'a');
    const { result, rerender } = renderHook(({ markdownDocument }) => useAutoSave(markdownDocument, 400), {
      initialProps: { markdownDocument: initial },
    });

    rerender({ markdownDocument: { ...initial, content: 'b' } });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.saveStatus).toBe('unsaved');
  });
});
