import { useState, type ReactNode } from 'react';
import type { ViewMode } from '../../types';

type MobileTab = 'editor' | 'preview';

const MOBILE_TABS: { value: MobileTab; label: string }[] = [
  { value: 'editor', label: 'Editor' },
  { value: 'preview', label: 'Preview' },
];

interface WorkspaceProps {
  viewMode: ViewMode;
  isDesktop: boolean;
  toolbar: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
}

export function Workspace({ viewMode, isDesktop, toolbar, editor, preview }: WorkspaceProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  // On small screens a side-by-side split is unusably narrow, so tabs replace view modes.
  const showEditor = isDesktop ? viewMode !== 'preview' : mobileTab === 'editor';
  const showPreview = isDesktop ? viewMode !== 'editor' : mobileTab === 'preview';
  const isSplit = showEditor && showPreview;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {!isDesktop && (
        <div role="tablist" aria-label="Panels" className="flex shrink-0 border-b border-zinc-200 dark:border-zinc-800">
          {MOBILE_TABS.map((tab) => {
            const isSelected = tab.value === mobileTab;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                id={`tab-${tab.value}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.value}`}
                onClick={() => setMobileTab(tab.value)}
                className={`flex-1 border-b-2 py-2 text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-500 ${
                  isSelected
                    ? 'border-zinc-900 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {showEditor && toolbar}

      <div className={`grid min-h-0 flex-1 ${isSplit ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* The editor stays mounted while hidden to preserve undo history, selection and scroll. */}
        <section
          id="panel-editor"
          role={isDesktop ? 'region' : 'tabpanel'}
          aria-labelledby={isDesktop ? undefined : 'tab-editor'}
          aria-label={isDesktop ? 'Editor' : undefined}
          hidden={!showEditor}
          className={`min-h-0 overflow-hidden ${isSplit ? 'border-r border-zinc-200 dark:border-zinc-800' : ''}`}
        >
          {editor}
        </section>
        {showPreview && (
          <section
            id="panel-preview"
            role={isDesktop ? 'region' : 'tabpanel'}
            aria-labelledby={isDesktop ? undefined : 'tab-preview'}
            aria-label={isDesktop ? 'Preview' : undefined}
            className="min-h-0 overflow-y-auto"
          >
            {preview}
          </section>
        )}
      </div>
    </main>
  );
}
