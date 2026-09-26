import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { AUTO_SAVE_DELAY_MS } from '../constants';
import { saveDocument } from '../lib/storage';
import type { MarkdownDocument, SaveStatus } from '../types';

interface AutoSave {
  saveStatus: SaveStatus;
  saveNow: () => void;
}

/**
 * Debounces writes of the document to localStorage.
 * Status is derived by comparing the current document object with the last
 * one that was successfully persisted, so "Saved" is never shown early.
 */
export function useAutoSave(markdownDocument: MarkdownDocument, delayMs = AUTO_SAVE_DELAY_MS): AutoSave {
  const [lastSavedDocument, setLastSavedDocument] = useState(markdownDocument);
  const [failedDocument, setFailedDocument] = useState<MarkdownDocument | null>(null);
  const latestDocumentRef = useRef(markdownDocument);

  const persist = useCallback((documentToSave: MarkdownDocument) => {
    if (saveDocument(documentToSave)) {
      setLastSavedDocument(documentToSave);
      setFailedDocument(null);
    } else {
      setFailedDocument(documentToSave);
    }
  }, []);

  useEffect(() => {
    latestDocumentRef.current = markdownDocument;
    if (markdownDocument === lastSavedDocument || markdownDocument === failedDocument) return;

    const timerId = window.setTimeout(() => persist(markdownDocument), delayMs);
    return () => window.clearTimeout(timerId);
  }, [markdownDocument, lastSavedDocument, failedDocument, delayMs, persist]);

  // Only write when this tab has unsaved edits: an idle second tab must not
  // overwrite newer work from another tab with its stale copy.
  const flushPendingChanges = useEffectEvent(() => {
    if (markdownDocument !== lastSavedDocument) persist(markdownDocument);
  });

  // Flush pending edits when the tab is hidden or closed, so the debounce window can't lose work.
  useEffect(() => {
    const flush = () => flushPendingChanges();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const saveNow = useCallback(() => persist(latestDocumentRef.current), [persist]);

  let saveStatus: SaveStatus = 'saving';
  if (markdownDocument === lastSavedDocument) saveStatus = 'saved';
  else if (markdownDocument === failedDocument) saveStatus = 'unsaved';

  return { saveStatus, saveNow };
}
