import { useCallback, useRef, useState, type DragEvent } from 'react';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { MarkdownEditor, type MarkdownEditorHandle } from './components/editor/MarkdownEditor';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { Workspace } from './components/layout/Workspace';
import { MarkdownPreview } from './components/preview/MarkdownPreview';
import { Button } from './components/ui/Button';
import { CloseIcon } from './components/ui/icons';
import { DEFAULT_DOCUMENT_TITLE, SAMPLE_MARKDOWN } from './constants';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePrintDocument } from './hooks/usePrintDocument';
import { useScrollSync } from './hooks/useScrollSync';
import { useTheme } from './hooks/useTheme';
import { exportDocumentAsPdf } from './lib/exportPdf';
import { downloadMarkdown, readMarkdownFile } from './lib/file';
import { getDocumentStats } from './lib/stats';
import { createDocument, loadDocument, loadSettings, saveSettings } from './lib/storage';
import type { EditorSettings, MarkdownDocument, MarkdownFormat } from './types';

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes('Files');
}

export default function App() {
  const [markdownDocument, setMarkdownDocument] = useState<MarkdownDocument>(loadDocument);
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const isDesktop = useMediaQuery('(min-width: 768px)');
  useTheme(settings.theme);
  const { saveStatus, saveNow } = useAutoSave(markdownDocument);
  useKeyboardShortcuts({ onSave: saveNow });
  usePrintDocument(markdownDocument.title, markdownDocument.content);
  useScrollSync({
    // Both panes are only visible side by side in the desktop split view.
    isActive: settings.scrollSync && isDesktop && settings.viewMode === 'split',
    editorRef,
    previewRef,
    markdownContent: markdownDocument.content,
  });

  const updateSettings = (changes: Partial<EditorSettings>) => {
    const nextSettings = { ...settings, ...changes };
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const updateContent = useCallback((content: string) => {
    setMarkdownDocument((previous) => ({ ...previous, content, updatedAt: new Date().toISOString() }));
  }, []);

  const updateTitle = (title: string) => {
    setMarkdownDocument((previous) => ({ ...previous, title, updatedAt: new Date().toISOString() }));
  };

  const applyFormat = useCallback((format: MarkdownFormat) => editorRef.current?.applyFormat(format), []);

  async function importFile(file: File) {
    const result = await readMarkdownFile(file);
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    const currentContent = markdownDocument.content;
    const hasOwnWork = currentContent.trim() !== '' && currentContent !== SAMPLE_MARKDOWN;
    // A native confirm keeps this simple; the replacement can also be undone with Ctrl/Cmd+Z.
    if (hasOwnWork && !window.confirm(`Replace the current document with "${file.name}"?`)) {
      return;
    }

    setErrorMessage(null);
    setMarkdownDocument(createDocument(result.title || DEFAULT_DOCUMENT_TITLE, result.content));
  }

  function handleDragEnter(event: DragEvent) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFile(true);
  }

  function handleDragOver(event: DragEvent) {
    if (!hasFiles(event)) return;
    // Required for the element to accept the drop.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(event: DragEvent) {
    if (!hasFiles(event)) return;
    // dragleave also fires when moving between child elements, so track nesting depth.
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDraggingFile(false);
  }

  function handleDrop(event: DragEvent) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFile(false);

    const file = event.dataTransfer.files[0];
    if (file) void importFile(file);
  }

  const stats = getDocumentStats(markdownDocument.content);

  return (
    <div
      className="relative flex h-dvh flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header
        title={markdownDocument.title}
        onTitleChange={updateTitle}
        viewMode={settings.viewMode}
        onViewModeChange={(viewMode) => updateSettings({ viewMode })}
        showViewModeSwitch={isDesktop}
        scrollSync={settings.scrollSync}
        onScrollSyncChange={(scrollSync) => updateSettings({ scrollSync })}
        themePreference={settings.theme}
        onThemeChange={(theme) => updateSettings({ theme })}
        onImportFile={(file) => void importFile(file)}
        onExportMarkdown={() => downloadMarkdown(markdownDocument.title, markdownDocument.content)}
        onExportPdf={() => void exportDocumentAsPdf(markdownDocument.title, markdownDocument.content)}
      />

      {errorMessage && (
        <div
          role="alert"
          className="flex shrink-0 items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <span className="flex-1">{errorMessage}</span>
          <Button
            aria-label="Dismiss message"
            className="h-6 w-6 px-0 text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900"
            onClick={() => setErrorMessage(null)}
          >
            <CloseIcon />
          </Button>
        </div>
      )}

      <Workspace
        viewMode={settings.viewMode}
        isDesktop={isDesktop}
        toolbar={<EditorToolbar onFormat={applyFormat} />}
        editor={<MarkdownEditor ref={editorRef} value={markdownDocument.content} onChange={updateContent} />}
        preview={<MarkdownPreview ref={previewRef} markdown={markdownDocument.content} />}
      />

      <StatusBar stats={stats} saveStatus={saveStatus} />

      {isDraggingFile && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-white/85 text-sm font-medium text-blue-700 dark:bg-zinc-950/85 dark:text-blue-300"
        >
          Drop a .md file to open it
        </div>
      )}
    </div>
  );
}
