import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupPrintDocument,
  exportDocumentAsPdf,
  getPdfFileName,
  isPrintDocumentPrepared,
  preparePrintDocument,
} from './exportPdf';

function getPrintDocument(): HTMLElement {
  const printDocument = document.getElementById('print-document');
  if (!printDocument) throw new Error('print document not found');
  return printDocument;
}

beforeEach(() => {
  document.title = 'Markdown Editor';
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  cleanupPrintDocument();
  vi.restoreAllMocks();
});

describe('getPdfFileName', () => {
  it('uses the same sanitization as Markdown export', () => {
    expect(getPdfFileName('My Document')).toBe('my-document.pdf');
    expect(getPdfFileName('한국어 문서')).toBe('한국어-문서.pdf');
    expect(getPdfFileName('  ')).toBe('document.pdf');
  });
});

describe('preparePrintDocument', () => {
  it('renders the document outside the React root with the title as heading', () => {
    preparePrintDocument('Report', '## Summary\n\n| a | b |\n| - | - |\n| 1 | 2 |');
    const printDocument = getPrintDocument();

    expect(printDocument.parentElement).toBe(document.body);
    expect(printDocument.querySelector('h1')?.textContent).toBe('Report');
    expect(printDocument.querySelector('h2')?.textContent).toBe('Summary');
    expect(printDocument.querySelector('table')).not.toBeNull();
  });

  it('does not repeat the title when the document already starts with it', () => {
    preparePrintDocument('Report', '# Report\n\nBody');
    expect(getPrintDocument().querySelectorAll('h1')).toHaveLength(1);
  });

  it('renders the title as text, not HTML', () => {
    preparePrintDocument('<img src=x onerror=alert(1)>', 'Body');
    const printDocument = getPrintDocument();
    expect(printDocument.querySelector('img')).toBeNull();
    expect(printDocument.querySelector('h1')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('uses the sanitized renderer for malicious Markdown', () => {
    preparePrintDocument('Doc', '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[x](javascript:alert(1))');
    const printDocument = getPrintDocument();
    expect(printDocument.querySelector('script')).toBeNull();
    expect(printDocument.querySelector('[onerror]')).toBeNull();
    expect(printDocument.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it('suggests the PDF file name through the page title and restores it on cleanup', () => {
    preparePrintDocument('Meeting Notes', 'Body');
    expect(document.title).toBe('meeting-notes');

    cleanupPrintDocument();
    expect(document.title).toBe('Markdown Editor');
    expect(isPrintDocumentPrepared()).toBe(false);
  });

  it('replaces a previous print document without losing the original page title', () => {
    preparePrintDocument('First', 'one');
    preparePrintDocument('Second', 'two');
    expect(document.querySelectorAll('#print-document')).toHaveLength(1);

    cleanupPrintDocument();
    expect(document.title).toBe('Markdown Editor');
  });

  it('is built the same way in dark mode', () => {
    document.documentElement.classList.add('dark');
    preparePrintDocument('Doc', 'Body');
    // Light print colors come from print CSS; the element must not opt into dark typography.
    expect(getPrintDocument().className).not.toMatch(/invert|dark/);
  });
});

describe('exportDocumentAsPdf', () => {
  it('opens the print dialog and cleans up after printing', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {
      expect(isPrintDocumentPrepared()).toBe(true);
    });

    await exportDocumentAsPdf('Doc', '# Doc\n\n```ts\nconst a = 1;\n```');
    expect(printSpy).toHaveBeenCalledOnce();
    expect(getPrintDocument().querySelector('.hljs-keyword')).not.toBeNull();

    window.dispatchEvent(new Event('afterprint'));
    expect(isPrintDocumentPrepared()).toBe(false);
    expect(document.title).toBe('Markdown Editor');
  });

  it('does not wait forever for images that never load', async () => {
    vi.useFakeTimers();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    const exportPromise = exportDocumentAsPdf('Doc', '![broken](https://example.invalid/image.png)');
    await vi.advanceTimersByTimeAsync(3000);
    await exportPromise;

    expect(printSpy).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
