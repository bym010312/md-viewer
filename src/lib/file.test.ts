import { describe, expect, it } from 'vitest';
import { isMarkdownFile, readMarkdownFile, sanitizeFileName, titleFromFileName } from './file';

describe('sanitizeFileName', () => {
  it('converts a title into a lowercase, dash-separated file name', () => {
    expect(sanitizeFileName('My Document')).toBe('my-document.md');
  });

  it('removes characters that are invalid in file names', () => {
    expect(sanitizeFileName('  a/b\\c:d*e?f"g<h>i|j  ')).toBe('abcdefghij.md');
  });

  it('keeps Korean characters', () => {
    expect(sanitizeFileName('내 문서 초안')).toBe('내-문서-초안.md');
  });

  it('falls back to document.md for empty or unusable titles', () => {
    expect(sanitizeFileName('')).toBe('document.md');
    expect(sanitizeFileName('   ')).toBe('document.md');
    expect(sanitizeFileName('///')).toBe('document.md');
    expect(sanitizeFileName('...')).toBe('document.md');
    expect(sanitizeFileName('CON')).toBe('document.md');
  });

  it('supports the .pdf extension with the same rules', () => {
    expect(sanitizeFileName('My Document', 'pdf')).toBe('my-document.pdf');
    expect(sanitizeFileName('', 'pdf')).toBe('document.pdf');
  });

  it('limits very long titles', () => {
    const fileName = sanitizeFileName('a'.repeat(500));
    expect(fileName.length).toBeLessThanOrEqual(103);
    expect(fileName.endsWith('.md')).toBe(true);
  });
});

describe('Markdown file detection', () => {
  it('accepts .md and .markdown in any case', () => {
    expect(isMarkdownFile('notes.md')).toBe(true);
    expect(isMarkdownFile('NOTES.MARKDOWN')).toBe(true);
    expect(isMarkdownFile('notes.txt')).toBe(false);
    expect(isMarkdownFile('notes.md.html')).toBe(false);
  });

  it('derives a title from the file name', () => {
    expect(titleFromFileName('Project Plan.markdown')).toBe('Project Plan');
  });
});

describe('readMarkdownFile', () => {
  it('reads a Markdown file as plain text', async () => {
    const file = new File(['# Hello\n<script>alert(1)</script>'], 'hello.md', { type: 'text/markdown' });
    const result = await readMarkdownFile(file);
    expect(result).toEqual({ ok: true, title: 'hello', content: '# Hello\n<script>alert(1)</script>' });
  });

  it('rejects unsupported file types with a readable message', async () => {
    const file = new File(['<html></html>'], 'page.html', { type: 'text/html' });
    const result = await readMarkdownFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/only markdown files/i);
  });
});
