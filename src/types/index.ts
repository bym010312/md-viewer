export type ViewMode = 'split' | 'editor' | 'preview';

export type ThemePreference = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface EditorSettings {
  theme: ThemePreference;
  viewMode: ViewMode;
  scrollSync: boolean;
}

export type MarkdownFormat =
  | 'heading1'
  | 'heading2'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'blockquote'
  | 'inlineCode'
  | 'codeBlock'
  | 'link'
  | 'image'
  | 'unorderedList'
  | 'orderedList'
  | 'taskList'
  | 'table'
  | 'horizontalRule';
