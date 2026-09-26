import type { ReactNode } from 'react';
import type { MarkdownFormat } from '../../types';
import { Button } from '../ui/Button';
import {
  BoldIcon,
  CodeBlockIcon,
  HorizontalRuleIcon,
  ImageIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  OrderedListIcon,
  QuoteIcon,
  StrikethroughIcon,
  TableIcon,
  TaskListIcon,
  UnorderedListIcon,
} from '../ui/icons';

interface ToolbarAction {
  format: MarkdownFormat;
  label: string;
  icon: ReactNode;
  shortcutKey?: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const modifierLabel = isMac ? '⌘' : 'Ctrl+';

const TOOLBAR_GROUPS: ToolbarAction[][] = [
  [
    { format: 'heading1', label: 'Heading 1', icon: <span className="text-xs font-bold">H1</span> },
    { format: 'heading2', label: 'Heading 2', icon: <span className="text-xs font-bold">H2</span> },
  ],
  [
    { format: 'bold', label: 'Bold', icon: <BoldIcon />, shortcutKey: 'B' },
    { format: 'italic', label: 'Italic', icon: <ItalicIcon />, shortcutKey: 'I' },
    { format: 'strikethrough', label: 'Strikethrough', icon: <StrikethroughIcon /> },
  ],
  [
    { format: 'blockquote', label: 'Blockquote', icon: <QuoteIcon /> },
    { format: 'inlineCode', label: 'Inline code', icon: <InlineCodeIcon /> },
    { format: 'codeBlock', label: 'Code block', icon: <CodeBlockIcon /> },
  ],
  [
    { format: 'link', label: 'Link', icon: <LinkIcon /> },
    { format: 'image', label: 'Image', icon: <ImageIcon /> },
  ],
  [
    { format: 'unorderedList', label: 'Bulleted list', icon: <UnorderedListIcon /> },
    { format: 'orderedList', label: 'Numbered list', icon: <OrderedListIcon /> },
    { format: 'taskList', label: 'Task list', icon: <TaskListIcon /> },
  ],
  [
    { format: 'table', label: 'Table', icon: <TableIcon /> },
    { format: 'horizontalRule', label: 'Horizontal rule', icon: <HorizontalRuleIcon /> },
  ],
];

interface EditorToolbarProps {
  onFormat: (format: MarkdownFormat) => void;
}

export function EditorToolbar({ onFormat }: EditorToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200 px-2 py-1 [scrollbar-width:thin] dark:border-zinc-800"
    >
      {TOOLBAR_GROUPS.map((group, groupIndex) => (
        <div key={groupIndex} className="flex shrink-0 items-center gap-0.5">
          {groupIndex > 0 && <span aria-hidden="true" className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />}
          {group.map((action) => {
            const shortcut = action.shortcutKey ? ` (${modifierLabel}${action.shortcutKey})` : '';
            return (
              <Button
                key={action.format}
                aria-label={action.label}
                title={`${action.label}${shortcut}`}
                className="w-8 px-0"
                // Keep focus (and the selection) in the editor when clicking with a mouse.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onFormat(action.format)}
              >
                {action.icon}
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
