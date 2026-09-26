const MARKDOWN_EXTENSIONS = ['.md', '.markdown'] as const;

// 10 MB is far beyond a normal Markdown document; larger files are almost
// certainly not what the user meant to open and would freeze the editor.
const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

const FALLBACK_FILE_NAME = 'document';
const MAX_FILE_NAME_LENGTH = 100;

// Names Windows refuses to create regardless of extension.
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

export function isMarkdownFile(fileName: string): boolean {
  const lowerCaseName = fileName.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((extension) => lowerCaseName.endsWith(extension));
}

export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.(md|markdown)$/i, '').trim();
}

export type ExportExtension = 'md' | 'pdf';

/** Converts a document title into a safe, lowercase file name (`my-document.md`). */
export function sanitizeFileName(title: string, extension: ExportExtension = 'md'): string {
  const baseName = title
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    // Characters that are invalid in file names on Windows/macOS/Linux, plus control characters.
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, MAX_FILE_NAME_LENGTH)
    .replace(/^[-.]+|[-.]+$/g, '');

  if (!baseName || RESERVED_WINDOWS_NAMES.test(baseName)) {
    return `${FALLBACK_FILE_NAME}.${extension}`;
  }
  return `${baseName}.${extension}`;
}

export type ImportResult =
  | { ok: true; title: string; content: string }
  | { ok: false; message: string };

export async function readMarkdownFile(file: File): Promise<ImportResult> {
  if (!isMarkdownFile(file.name)) {
    return { ok: false, message: 'Only Markdown files (.md, .markdown) are supported.' };
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { ok: false, message: 'This file is too large to open.' };
  }

  try {
    // Imported content is only ever treated as plain text.
    const content = await file.text();
    return { ok: true, title: titleFromFileName(file.name), content };
  } catch {
    return { ok: false, message: 'Unable to open this file.' };
  }
}

export function downloadMarkdown(title: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sanitizeFileName(title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke asynchronously; some browsers cancel the download if revoked synchronously.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
