import { useRef, type ChangeEvent } from 'react';
import type { ThemePreference, ViewMode } from '../../types';
import { Button } from '../ui/Button';
import { ImportIcon, ScrollSyncIcon } from '../ui/icons';
import { ExportMenu } from './ExportMenu';

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'editor', label: 'Editor' },
  { value: 'split', label: 'Split' },
  { value: 'preview', label: 'Preview' },
];

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  showViewModeSwitch: boolean;
  scrollSync: boolean;
  onScrollSyncChange: (scrollSync: boolean) => void;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onImportFile: (file: File) => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
}

export function Header({
  title,
  onTitleChange,
  viewMode,
  onViewModeChange,
  showViewModeSwitch,
  scrollSync,
  onScrollSyncChange,
  themePreference,
  onThemeChange,
  onImportFile,
  onExportMarkdown,
  onExportPdf,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still fires a change event.
    event.target.value = '';
    if (file) onImportFile(file);
  }

  function handleThemeChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedTheme = THEME_OPTIONS.find((option) => option.value === event.target.value);
    if (selectedTheme) onThemeChange(selectedTheme.value);
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 dark:border-zinc-800">
      <h1 className="hidden shrink-0 text-sm font-semibold text-zinc-900 sm:block dark:text-zinc-100">
        Markdown Editor
      </h1>
      <span aria-hidden="true" className="hidden text-zinc-300 sm:block dark:text-zinc-700">
        /
      </span>
      <input
        type="text"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Untitled"
        aria-label="Document title"
        maxLength={200}
        className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm text-zinc-800 placeholder:text-zinc-400 hover:bg-zinc-100 focus-visible:bg-transparent focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-800"
      />

      {showViewModeSwitch && (
        <div
          role="group"
          aria-label="View mode"
          className="flex shrink-0 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800"
        >
          {VIEW_MODE_OPTIONS.map((option) => {
            const isActive = option.value === viewMode;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onViewModeChange(option.value)}
                className={`rounded px-2.5 py-0.5 text-xs focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  isActive
                    ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {showViewModeSwitch && (
        <button
          type="button"
          role="switch"
          aria-checked={scrollSync}
          aria-label="Synchronize editor and preview scrolling"
          title={viewMode === 'split' ? 'Scroll sync' : 'Scroll sync (works in Split view)'}
          onClick={() => onScrollSyncChange(!scrollSync)}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ScrollSyncIcon />
          <span className="hidden lg:inline">Scroll sync</span>
          {/* The knob position and the On/Off text show the state without relying on color. */}
          <span
            aria-hidden="true"
            className={`relative h-3.5 w-6 rounded-full transition-colors ${
              scrollSync ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-0.5 size-2.5 rounded-full bg-white transition-[left] ${
                scrollSync ? 'left-3 dark:bg-zinc-900' : 'left-0.5 dark:bg-zinc-400'
              }`}
            />
          </span>
          <span aria-hidden="true" className="w-5 text-left">
            {scrollSync ? 'On' : 'Off'}
          </span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
      <Button aria-label="Import Markdown file" title="Import .md file" onClick={() => fileInputRef.current?.click()}>
        <ImportIcon />
        <span className="hidden md:inline">Import</span>
      </Button>
      <ExportMenu onExportMarkdown={onExportMarkdown} onExportPdf={onExportPdf} />

      <label className="sr-only" htmlFor="theme-select">
        Theme
      </label>
      <select
        id="theme-select"
        value={themePreference}
        onChange={handleThemeChange}
        className="h-8 shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 text-xs text-zinc-700 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </header>
  );
}
