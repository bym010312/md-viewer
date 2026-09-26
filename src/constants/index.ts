import type { EditorSettings } from '../types';

export const DOCUMENT_STORAGE_KEY = 'md-editor:document';

// Keep in sync with the theme bootstrap script in index.html.
export const SETTINGS_STORAGE_KEY = 'md-editor:settings';

export const AUTO_SAVE_DELAY_MS = 400;

export const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'system',
  viewMode: 'split',
};

export const DEFAULT_DOCUMENT_TITLE = 'Welcome';

export const SAMPLE_MARKDOWN = `# Markdown Editor

Start writing Markdown here. The preview updates as you type.

## Features

- Live preview
- Auto save
- Markdown import / export
- [x] Task lists
- [ ] Tables and more

> Tip: select some text and press **Ctrl/Cmd + B** to make it bold.

| Shortcut | Action |
| -------- | ------ |
| Ctrl/Cmd + B | Bold |
| Ctrl/Cmd + I | Italic |
| Ctrl/Cmd + S | Save |

\`\`\`ts
console.log('Hello Markdown');
\`\`\`
`;
