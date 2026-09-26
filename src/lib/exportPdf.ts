import { sanitizeFileName } from './file';
import { renderMarkdown } from './markdown';

const PRINT_DOCUMENT_ID = 'print-document';

// Don't let a slow or broken external image block the print dialog forever.
const IMAGE_LOAD_TIMEOUT_MS = 3000;

let restorePageTitle: (() => void) | null = null;

export function getPdfFileName(title: string): string {
  return sanitizeFileName(title, 'pdf');
}

function startsWithSameHeading(article: HTMLElement, title: string): boolean {
  const firstElement = article.firstElementChild;
  return firstElement?.tagName === 'H1' && firstElement.textContent?.trim() === title;
}

export function isPrintDocumentPrepared(): boolean {
  return document.getElementById(PRINT_DOCUMENT_ID) !== null;
}

/** Removes the print-only document and restores the original page title. Safe to call repeatedly. */
export function cleanupPrintDocument(): void {
  document.getElementById(PRINT_DOCUMENT_ID)?.remove();
  restorePageTitle?.();
  restorePageTitle = null;
}

/**
 * Builds a print-only copy of the rendered document outside the React root.
 * Print CSS (see index.css) hides the app and shows only this element, so the
 * PDF is the same whether the preview panel is currently visible or not.
 */
export function preparePrintDocument(title: string, markdownContent: string): HTMLElement {
  cleanupPrintDocument();

  const article = document.createElement('article');
  article.id = PRINT_DOCUMENT_ID;
  article.className = 'print-document prose prose-zinc';
  // Uses the same sanitizing renderer as the preview; the raw Markdown is never rendered any other way.
  article.innerHTML = renderMarkdown(markdownContent);

  const trimmedTitle = title.trim();
  if (trimmedTitle && !startsWithSameHeading(article, trimmedTitle)) {
    const titleHeading = document.createElement('h1');
    titleHeading.textContent = trimmedTitle;
    article.prepend(titleHeading);
  }

  document.body.appendChild(article);

  // Browsers suggest the page title as the PDF file name; the app can't set it directly.
  const originalPageTitle = document.title;
  document.title = getPdfFileName(title).replace(/\.pdf$/, '');
  restorePageTitle = () => {
    document.title = originalPageTitle;
  };

  return article;
}

function waitForImages(container: HTMLElement, timeoutMs: number): Promise<void> {
  const pendingImages = Array.from(container.querySelectorAll('img')).filter((image) => !image.complete);
  if (pendingImages.length === 0) return Promise.resolve();

  // Failed images resolve too: a broken image must not prevent the export.
  const allSettled = Promise.all(
    pendingImages.map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs));
  return Promise.race([allSettled, timeout]);
}

/** Opens the browser print dialog for the rendered document, where the user can choose "Save as PDF". */
export async function exportDocumentAsPdf(title: string, markdownContent: string): Promise<void> {
  const printDocument = preparePrintDocument(title, markdownContent);
  await waitForImages(printDocument, IMAGE_LOAD_TIMEOUT_MS);

  window.addEventListener('afterprint', cleanupPrintDocument, { once: true });
  window.print();
}
