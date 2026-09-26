export interface DocumentStats {
  words: number;
  characters: number;
  lines: number;
}

// A "word" is any whitespace-separated token containing a letter or digit,
// so bare Markdown syntax such as "#", "-" or "```" is not counted.
// Korean separates words with spaces, so this works for mixed Korean/English text.
const WORD_CHARACTER = /[\p{L}\p{N}]/u;

export function getDocumentStats(markdownContent: string): DocumentStats {
  const words = markdownContent
    .split(/\s+/)
    .filter((token) => WORD_CHARACTER.test(token)).length;

  return {
    words,
    // Count code points rather than UTF-16 units so emoji count as one character.
    characters: Array.from(markdownContent).length,
    // Matches the editor's line numbering: an empty document has one line.
    lines: markdownContent.split('\n').length,
  };
}
