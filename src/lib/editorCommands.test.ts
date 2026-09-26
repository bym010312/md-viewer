import { describe, expect, it } from 'vitest';
import type { MarkdownFormat } from '../types';
import { applyMarkdownFormat, type TextSelection } from './editorCommands';

/** Applies a format and returns the resulting document and selected text. */
function format(doc: string, selection: TextSelection, markdownFormat: MarkdownFormat) {
  const result = applyMarkdownFormat(doc, selection, markdownFormat);
  const nextDoc = doc.slice(0, result.from) + result.insert + doc.slice(result.to);
  const { anchor, head } = result.selection;
  return {
    doc: nextDoc,
    selectedText: nextDoc.slice(Math.min(anchor, head), Math.max(anchor, head)),
    cursor: head,
  };
}

function selectText(doc: string, text: string): TextSelection {
  const from = doc.indexOf(text);
  return { from, to: from + text.length };
}

describe('inline formats', () => {
  it('wraps the selected text in bold markers and keeps it selected', () => {
    const result = format('Hello', { from: 0, to: 5 }, 'bold');
    expect(result.doc).toBe('**Hello**');
    expect(result.selectedText).toBe('Hello');
  });

  it('inserts a selected placeholder when nothing is selected', () => {
    const result = format('', { from: 0, to: 0 }, 'bold');
    expect(result.doc).toBe('**bold text**');
    expect(result.selectedText).toBe('bold text');
  });

  it('toggles bold off when the markers surround the selection', () => {
    const doc = 'say **Hello** now';
    const result = format(doc, selectText(doc, 'Hello'), 'bold');
    expect(result.doc).toBe('say Hello now');
    expect(result.selectedText).toBe('Hello');
  });

  it('toggles bold off when the selection includes the markers', () => {
    const result = format('**Hello**', { from: 0, to: 9 }, 'bold');
    expect(result.doc).toBe('Hello');
  });

  it('does not mistake bold for italic', () => {
    const doc = '**Hello**';
    const result = format(doc, selectText(doc, 'Hello'), 'italic');
    expect(result.doc).toBe('***Hello***');
  });

  it('keeps surrounding whitespace outside the markers', () => {
    const result = format('a Hello b', { from: 1, to: 8 }, 'italic');
    expect(result.doc).toBe('a *Hello* b');
    expect(result.selectedText).toBe('Hello');
  });

  it('wraps each line of a multiline selection separately', () => {
    const doc = 'one\n\ntwo';
    const result = format(doc, { from: 0, to: doc.length }, 'strikethrough');
    expect(result.doc).toBe('~~one~~\n\n~~two~~');
  });

  it('handles Korean text', () => {
    const result = format('안녕하세요', { from: 0, to: 5 }, 'inlineCode');
    expect(result.doc).toBe('`안녕하세요`');
  });
});

describe('line prefix formats', () => {
  it('turns the current line into a heading without moving the cursor off the text', () => {
    const result = format('Title', { from: 2, to: 2 }, 'heading1');
    expect(result.doc).toBe('# Title');
    expect(result.cursor).toBe(4);
  });

  it('replaces an existing heading level and toggles the same level off', () => {
    expect(format('# Title', { from: 3, to: 3 }, 'heading2').doc).toBe('## Title');
    expect(format('## Title', { from: 3, to: 3 }, 'heading2').doc).toBe('Title');
  });

  it('inserts a placeholder heading on an empty line', () => {
    const result = format('', { from: 0, to: 0 }, 'heading1');
    expect(result.doc).toBe('# Heading');
    expect(result.selectedText).toBe('Heading');
  });

  it('numbers ordered list items and skips blank lines', () => {
    const doc = 'a\nb\n\nc';
    expect(format(doc, { from: 0, to: doc.length }, 'orderedList').doc).toBe('1. a\n2. b\n\n3. c');
  });

  it('converts between list types', () => {
    const doc = '- a\n- b';
    expect(format(doc, { from: 0, to: doc.length }, 'taskList').doc).toBe('- [ ] a\n- [ ] b');
    expect(format('- [ ] a', { from: 0, to: 7 }, 'unorderedList').doc).toBe('- a');
  });

  it('toggles blockquote off when every line is quoted', () => {
    const doc = '> a\n> b';
    expect(format(doc, { from: 0, to: doc.length }, 'blockquote').doc).toBe('a\nb');
  });

  it('ignores the next line when the selection ends at its start', () => {
    const doc = 'a\nb';
    expect(format(doc, { from: 0, to: 2 }, 'unorderedList').doc).toBe('- a\nb');
  });
});

describe('block formats', () => {
  it('wraps the selection in a code fence on its own lines', () => {
    const doc = 'intro\nconst a = 1;';
    const result = format(doc, selectText(doc, 'const a = 1;'), 'codeBlock');
    expect(result.doc).toBe('intro\n\n```\nconst a = 1;\n```\n');
    expect(result.selectedText).toBe('const a = 1;');
  });

  it('separates a horizontal rule from the paragraph above with a blank line', () => {
    const doc = 'Paragraph';
    const result = format(doc, { from: doc.length, to: doc.length }, 'horizontalRule');
    // Without the blank line, "---" would turn the paragraph into a heading.
    expect(result.doc).toBe('Paragraph\n\n---\n');
    expect(result.cursor).toBe(result.doc.length);
  });

  it('inserts a table with the first header selected', () => {
    const result = format('', { from: 0, to: 0 }, 'table');
    expect(result.doc.startsWith('| Column 1 | Column 2 |')).toBe(true);
    expect(result.selectedText).toBe('Column 1');
  });
});

describe('links and images', () => {
  it('uses the selected text as link label and selects the url placeholder', () => {
    const result = format('Docs', { from: 0, to: 4 }, 'link');
    expect(result.doc).toBe('[Docs](url)');
    expect(result.selectedText).toBe('url');
  });

  it('uses a selected URL as the link target', () => {
    const doc = 'https://example.com';
    const result = format(doc, { from: 0, to: doc.length }, 'link');
    expect(result.doc).toBe('[link text](https://example.com)');
    expect(result.selectedText).toBe('link text');
  });

  it('inserts an image placeholder', () => {
    const result = format('', { from: 0, to: 0 }, 'image');
    expect(result.doc).toBe('![alt text](url)');
    expect(result.selectedText).toBe('alt text');
  });
});
