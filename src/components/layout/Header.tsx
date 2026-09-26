import { useRef, type ChangeEvent } from 'react';
import type { ThemePreference, ViewMode } from '../../types';
import { Button } from '../ui/Button';
import { ExportIcon, ImportIcon } from '../ui/icons';

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
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onImportFile: (file: File) => void;
  onExport: () => void;
}

export function Header({
  title,
  onTitleChange,
  viewMode,
  onViewModeChange,
  showViewModeSwitch,
  themePreference,
  onThemeChange,
  onImportFile,
  onExport,
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
      <Button aria-label="Export as Markdown file" title="Export as .md file" onClick={onExport}>
        <ExportIcon />
        <span className="hidden md:inline">Export</span>
      </Button>

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
