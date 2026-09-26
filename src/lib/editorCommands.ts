import type { MarkdownFormat } from '../types';

export interface TextSelection {
  from: number;
  to: number;
}

/**
 * A single text replacement plus the selection to apply afterwards.
 * `selection` offsets refer to the document *after* the change.
 */
export interface FormatEdit {
  from: number;
  to: number;
  insert: string;
  selection: { anchor: number; head: number };
}

type InlineMarker = '**' | '*' | '~~' | '`';

interface LinePrefixRule {
  /** Matches an existing prefix of the same kind (used for toggling off). */
  existing: RegExp;
  /** Matches prefixes of related kinds that should be replaced. */
  replaceable: RegExp;
  prefix: (lineIndex: number) => string;
  placeholder?: string;
}

const LIST_PREFIX = /^([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)/;
const HEADING_PREFIX = /^#{1,6}\s+/;

const LINE_PREFIX_RULES: Partial<Record<MarkdownFormat, LinePrefixRule>> = {
  heading1: { existing: /^#\s+/, replaceable: HEADING_PREFIX, prefix: () => '# ', placeholder: 'Heading' },
  heading2: { existing: /^##\s+/, replaceable: HEADING_PREFIX, prefix: () => '## ', placeholder: 'Heading' },
  blockquote: { existing: /^>\s?/, replaceable: /^>\s?/, prefix: () => '> ' },
  unorderedList: {
    existing: /^[-*+]\s+(?!\[[ xX]\])/,
    replaceable: LIST_PREFIX,
    prefix: () => '- ',
  },
  orderedList: { existing: /^\d+[.)]\s+/, replaceable: LIST_PREFIX, prefix: (lineIndex) => `${lineIndex + 1}. ` },
  taskList: { existing: /^[-*+]\s+\[[ xX]\]\s+/, replaceable: LIST_PREFIX, prefix: () => '- [ ] ' },
};

const INLINE_RULES: Partial<Record<MarkdownFormat, { marker: InlineMarker; placeholder: string }>> = {
  bold: { marker: '**', placeholder: 'bold text' },
  italic: { marker: '*', placeholder: 'italic text' },
  strikethrough: { marker: '~~', placeholder: 'strikethrough text' },
  inlineCode: { marker: '`', placeholder: 'code' },
};

const TABLE_TEMPLATE = ['| Column 1 | Column 2 |', '| -------- | -------- |', '| Cell     | Cell     |'].join('\n');

function edit(from: number, to: number, insert: string, anchor: number, head = anchor): FormatEdit {
  return { from, to, insert, selection: { anchor, head } };
}

// ---------------------------------------------------------------------------
// Inline formats (bold, italic, strikethrough, inline code)
// ---------------------------------------------------------------------------

function countRun(text: string, character: string, fromEnd: boolean): number {
  let count = 0;
  if (fromEnd) {
    for (let index = text.length - 1; index >= 0 && text[index] === character; index--) count++;
  } else {
    for (let index = 0; index < text.length && text[index] === character; index++) count++;
  }
  return count;
}

/**
 * Decides whether a run of marker characters contains the marker.
 * `*` needs special care: a run of 2 is bold (not italic), a run of 3 is bold + italic.
 */
function runContainsMarker(runLength: number, marker: InlineMarker): boolean {
  if (marker.length === 2) return runLength >= 2;
  if (marker === '*') return runLength === 1 || runLength === 3;
  return runLength === 1;
}

function isWrappedWith(text: string, marker: InlineMarker): boolean {
  const character = marker[0];
  if (text.length < marker.length * 2 + 1) return false;
  return (
    runContainsMarker(countRun(text, character, false), marker) &&
    runContainsMarker(countRun(text, character, true), marker)
  );
}

function wrapPreservingWhitespace(text: string, marker: InlineMarker): string {
  // Markdown ignores emphasis like "** Hello**", so keep surrounding spaces outside the markers.
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!match || !match[2]) return text;
  return `${match[1]}${marker}${match[2]}${marker}${match[3]}`;
}

function unwrap(text: string, marker: InlineMarker): string {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!match) return text;
  const inner = match[2].slice(marker.length, match[2].length - marker.length);
  return `${match[1]}${inner}${match[3]}`;
}

function applyInlineFormat(
  doc: string,
  { from, to }: TextSelection,
  marker: InlineMarker,
  placeholder: string,
): FormatEdit {
  const selectedText = doc.slice(from, to);
  const markerLength = marker.length;

  if (!selectedText) {
    const insert = `${marker}${placeholder}${marker}`;
    return edit(from, to, insert, from + markerLength, from + markerLength + placeholder.length);
  }

  if (selectedText.includes('\n')) {
    return applyInlineFormatToLines(from, to, selectedText, marker);
  }

  // Toggle off when the markers sit just outside the selection: **|Hello|**
  const character = marker[0];
  const runBefore = countRun(doc.slice(Math.max(0, from - 3), from), character, true);
  const runAfter = countRun(doc.slice(to, to + 3), character, false);
  if (runContainsMarker(runBefore, marker) && runContainsMarker(runAfter, marker)) {
    return edit(from - markerLength, to + markerLength, selectedText, from - markerLength, to - markerLength);
  }

  // Toggle off when the selection includes the markers: |**Hello**|
  if (isWrappedWith(selectedText.trim(), marker)) {
    const unwrapped = unwrap(selectedText, marker);
    return edit(from, to, unwrapped, from, from + unwrapped.length);
  }

  const wrapped = wrapPreservingWhitespace(selectedText, marker);
  const leadingWhitespace = selectedText.length - selectedText.trimStart().length;
  const trailingWhitespace = selectedText.length - selectedText.trimEnd().length;
  // Keep the original words selected so the action can be toggled or chained.
  return edit(
    from,
    to,
    wrapped,
    from + leadingWhitespace + markerLength,
    from + wrapped.length - trailingWhitespace - markerLength,
  );
}

/** Emphasis cannot span paragraphs in Markdown, so each line is wrapped separately. */
function applyInlineFormatToLines(from: number, to: number, selectedText: string, marker: InlineMarker): FormatEdit {
  const lines = selectedText.split('\n');
  const contentLines = lines.filter((line) => line.trim());
  const shouldUnwrap = contentLines.length > 0 && contentLines.every((line) => isWrappedWith(line.trim(), marker));

  const insert = lines
    .map((line) => {
      if (!line.trim()) return line;
      return shouldUnwrap ? unwrap(line, marker) : wrapPreservingWhitespace(line, marker);
    })
    .join('\n');

  return edit(from, to, insert, from, from + insert.length);
}

// ---------------------------------------------------------------------------
// Line prefix formats (headings, blockquote, lists)
// ---------------------------------------------------------------------------

function getLineRange(doc: string, { from, to }: TextSelection): { start: number; end: number } {
  const start = doc.lastIndexOf('\n', from - 1) + 1;
  // A selection ending at the very start of a line should not affect that line.
  const effectiveTo = to > from && doc[to - 1] === '\n' ? to - 1 : to;
  const newlineIndex = doc.indexOf('\n', effectiveTo);
  const end = newlineIndex === -1 ? doc.length : newlineIndex;
  return { start: Math.min(start, end), end };
}

function splitIndent(line: string): { indent: string; rest: string } {
  const match = /^(\s*)([\s\S]*)$/.exec(line);
  return { indent: match?.[1] ?? '', rest: match?.[2] ?? line };
}

function applyLinePrefix(doc: string, selection: TextSelection, rule: LinePrefixRule): FormatEdit {
  const { start, end } = getLineRange(doc, selection);
  const originalBlock = doc.slice(start, end);
  const lines = originalBlock.split('\n');

  if (lines.length === 1 && !lines[0].trim()) {
    const prefix = rule.prefix(0);
    const placeholder = rule.placeholder ?? '';
    const insert = `${lines[0]}${prefix}${placeholder}`;
    const placeholderStart = start + lines[0].length + prefix.length;
    return edit(start, end, insert, placeholderStart, placeholderStart + placeholder.length);
  }

  const contentLines = lines.filter((line) => line.trim());
  const shouldRemove = contentLines.every((line) => rule.existing.test(splitIndent(line).rest));

  let contentLineIndex = 0;
  const newLines = lines.map((line) => {
    if (!line.trim()) return line;
    const { indent, rest } = splitIndent(line);
    const withoutPrefix = rest.replace(rule.replaceable, '');
    if (shouldRemove) return `${indent}${withoutPrefix}`;
    return `${indent}${rule.prefix(contentLineIndex++)}${withoutPrefix}`;
  });
  const insert = newLines.join('\n');

  if (lines.length === 1) {
    // Single line: keep the cursor/selection on the same text it was on.
    const delta = insert.length - originalBlock.length;
    const lineEnd = start + insert.length;
    const clamp = (position: number) => Math.min(Math.max(position + delta, start), lineEnd);
    return edit(start, end, insert, clamp(selection.from), clamp(selection.to));
  }

  return edit(start, end, insert, start, start + insert.length);
}

// ---------------------------------------------------------------------------
// Block formats (code block, table, horizontal rule)
// ---------------------------------------------------------------------------

/**
 * Inserts a block surrounded by blank lines. The blank line before matters:
 * `---` directly under a paragraph would turn it into a setext heading.
 */
function insertBlock(
  doc: string,
  { from, to }: TextSelection,
  block: string,
  selectionInBlock: { start: number; end: number },
): FormatEdit {
  const textBefore = doc.slice(0, from);
  const textAfter = doc.slice(to);

  let leading = '\n\n';
  if (from === 0 || textBefore.endsWith('\n\n')) leading = '';
  else if (textBefore.endsWith('\n')) leading = '\n';

  let trailing = '\n\n';
  if (textAfter.length === 0) trailing = '\n';
  else if (textAfter.startsWith('\n\n')) trailing = '';
  else if (textAfter.startsWith('\n')) trailing = '\n';

  const insert = `${leading}${block}${trailing}`;
  const blockStart = from + leading.length;
  return edit(from, to, insert, blockStart + selectionInBlock.start, blockStart + selectionInBlock.end);
}

function applyCodeBlock(doc: string, selection: TextSelection): FormatEdit {
  const selectedText = doc.slice(selection.from, selection.to);
  const code = selectedText || 'code';
  const fence = '```';
  const block = `${fence}\n${code}\n${fence}`;
  const codeStart = fence.length + 1;
  return insertBlock(doc, selection, block, { start: codeStart, end: codeStart + code.length });
}

function applyTable(doc: string, selection: TextSelection): FormatEdit {
  const firstHeader = 'Column 1';
  const headerStart = TABLE_TEMPLATE.indexOf(firstHeader);
  return insertBlock(doc, selection, TABLE_TEMPLATE, { start: headerStart, end: headerStart + firstHeader.length });
}

function applyHorizontalRule(doc: string, selection: TextSelection): FormatEdit {
  const rule = '---';
  // Place the cursor on the line after the rule so the user can keep typing.
  return insertBlock(doc, selection, rule, { start: rule.length + 1, end: rule.length + 1 });
}

// ---------------------------------------------------------------------------
// Links and images
// ---------------------------------------------------------------------------

const URL_PATTERN = /^https?:\/\/\S+$/i;

function applyLinkLike(doc: string, { from, to }: TextSelection, prefix: '' | '!'): FormatEdit {
  const selectedText = doc.slice(from, to).trim();
  const labelPlaceholder = prefix ? 'alt text' : 'link text';

  if (!selectedText || URL_PATTERN.test(selectedText)) {
    const url = selectedText || 'url';
    const insert = `${prefix}[${labelPlaceholder}](${url})`;
    const labelStart = from + prefix.length + 1;
    return edit(from, to, insert, labelStart, labelStart + labelPlaceholder.length);
  }

  const insert = `${prefix}[${selectedText}](url)`;
  const urlStart = from + prefix.length + selectedText.length + 3;
  return edit(from, to, insert, urlStart, urlStart + 'url'.length);
}

// ---------------------------------------------------------------------------

/** Computes the edit for a Markdown formatting action on the given selection. */
export function applyMarkdownFormat(doc: string, selection: TextSelection, format: MarkdownFormat): FormatEdit {
  const normalizedSelection = {
    from: Math.min(selection.from, selection.to),
    to: Math.max(selection.from, selection.to),
  };

  const inlineRule = INLINE_RULES[format];
  if (inlineRule) {
    return applyInlineFormat(doc, normalizedSelection, inlineRule.marker, inlineRule.placeholder);
  }

  const linePrefixRule = LINE_PREFIX_RULES[format];
  if (linePrefixRule) {
    return applyLinePrefix(doc, normalizedSelection, linePrefixRule);
  }

  switch (format) {
    case 'codeBlock':
      return applyCodeBlock(doc, normalizedSelection);
    case 'table':
      return applyTable(doc, normalizedSelection);
    case 'horizontalRule':
      return applyHorizontalRule(doc, normalizedSelection);
    case 'link':
      return applyLinkLike(doc, normalizedSelection, '');
    case 'image':
      return applyLinkLike(doc, normalizedSelection, '!');
    default:
      throw new Error(`Unsupported Markdown format: ${format}`);
  }
}
