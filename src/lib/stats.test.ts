import { describe, expect, it } from 'vitest';
import { getDocumentStats } from './stats';

describe('getDocumentStats', () => {
  it('handles an empty document', () => {
    expect(getDocumentStats('')).toEqual({ words: 0, characters: 0, lines: 1 });
  });

  it('does not count bare Markdown syntax as words', () => {
    expect(getDocumentStats('# Hello world\n\n- item\n---').words).toBe(3);
  });

  it('counts mixed Korean and English words', () => {
    expect(getDocumentStats('안녕하세요 Markdown 편집기입니다').words).toBe(3);
  });

  it('counts characters by code point and lines by newline', () => {
    const stats = getDocumentStats('한글 😀\nline two');
    expect(stats.characters).toBe(13);
    expect(stats.lines).toBe(2);
  });
});
