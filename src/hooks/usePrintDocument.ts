import { useEffect, useEffectEvent } from 'react';
import { cleanupPrintDocument, isPrintDocumentPrepared, preparePrintDocument } from '../lib/exportPdf';

/**
 * Makes the browser's own print command (Ctrl/Cmd+P, menu) print the rendered
 * document too, instead of a blank page — print CSS always hides the app UI.
 */
export function usePrintDocument(title: string, markdownContent: string): void {
  const handleBeforePrint = useEffectEvent(() => {
    // PDF export has already prepared it (and waited for images).
    if (isPrintDocumentPrepared()) return;
    preparePrintDocument(title, markdownContent);
  });

  useEffect(() => {
    const beforePrint = () => handleBeforePrint();
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', cleanupPrintDocument);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', cleanupPrintDocument);
    };
  }, []);
}
