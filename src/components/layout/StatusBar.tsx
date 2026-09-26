import type { DocumentStats } from '../../lib/stats';
import type { SaveStatus } from '../../types';

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Unsaved',
};

// The dot is decorative; the text label carries the meaning.
const SAVE_STATUS_DOT: Record<SaveStatus, string> = {
  saved: 'bg-emerald-500',
  saving: 'bg-amber-400',
  unsaved: 'bg-red-500',
};

interface StatusBarProps {
  stats: DocumentStats;
  saveStatus: SaveStatus;
}

export function StatusBar({ stats, saveStatus }: StatusBarProps) {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-2 border-t border-zinc-200 px-3 text-xs text-zinc-500 tabular-nums dark:border-zinc-800 dark:text-zinc-400">
      <span>Words {stats.words.toLocaleString()}</span>
      <span aria-hidden="true">·</span>
      <span>Characters {stats.characters.toLocaleString()}</span>
      <span aria-hidden="true">·</span>
      <span>Lines {stats.lines.toLocaleString()}</span>
      <span
        role="status"
        className="ml-auto flex shrink-0 items-center gap-1.5"
        title={saveStatus === 'unsaved' ? 'Unable to save to browser storage.' : undefined}
      >
        <span aria-hidden="true" className={`size-1.5 rounded-full ${SAVE_STATUS_DOT[saveStatus]}`} />
        {SAVE_STATUS_LABELS[saveStatus]}
      </span>
    </footer>
  );
}
