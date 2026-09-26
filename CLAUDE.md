# CLAUDE.md

## Project Overview

This project is a **web-based Markdown Editor**.

The core product experience is:

```text
Write
  ↓
Preview
  ↓
Export
   ├ Markdown (.md)
   └ PDF (.pdf)
```

Users should be able to write Markdown, preview the rendered result in real time, automatically preserve their work, import/export Markdown files, and export the rendered document as PDF with minimal friction.

The MVP should remain simple and focused. Do not add unnecessary backend, authentication, collaboration, or AI features unless explicitly requested.

---

## Product Goals

The application should provide:

- Fast Markdown writing
- Real-time Markdown preview
- Simple Markdown formatting tools
- Automatic local saving
- Markdown file import/export
- Light and dark themes
- Responsive desktop/mobile layouts
- Keyboard-focused editing experience
- Safe Markdown rendering

Prioritize:

1. Simplicity
2. Performance
3. Reliability
4. Accessibility
5. Maintainable code

---

# Tech Stack

Use the following stack unless explicitly instructed otherwise.

## Core

- React
- TypeScript
- Vite

## Styling

- Tailwind CSS

## Editor

Prefer:

- CodeMirror 6

Avoid introducing Monaco Editor unless there is a clear requirement that CodeMirror cannot satisfy.

## Markdown

Preferred options:

- markdown-it

or, when AST-level processing becomes necessary:

- remark
- rehype

Do not use multiple Markdown parsing systems simultaneously unless necessary.

## Syntax Highlighting

Prefer one of:

- Shiki
- highlight.js

Use only one syntax highlighting system.

## State

For MVP, prefer:

- React state
- React Context when shared global state is genuinely needed

Do not add Redux, Zustand, MobX, or other external state libraries unless application complexity clearly justifies them.

## Persistence

MVP persistence should use:

- localStorage

No database or backend is required for the initial version.

---

# MVP Scope

Implement only the following features unless explicitly requested otherwise.

## Editor

- Markdown text input
- Syntax highlighting where appropriate
- Undo / redo
- Keyboard shortcuts

## Preview

- Real-time Markdown rendering
- Safe HTML output
- Code block syntax highlighting

## Toolbar

Support common Markdown formatting actions:

- H1
- H2
- Bold
- Italic
- Strikethrough
- Blockquote
- Inline code
- Code block
- Link
- Image
- Unordered list
- Ordered list
- Task list
- Table
- Horizontal rule

Toolbar actions should operate on the current text selection whenever possible.

Example:

Selected text:

```text
Hello
```

Bold action:

```markdown
**Hello**
```

---

## View Modes

Support:

- Split
- Editor only
- Preview only

Default:

- Split

On smaller mobile screens, prefer tab-based switching rather than forcing both panels side-by-side.

---

## Local Persistence

Automatically save:

- document title
- Markdown content
- last updated time
- theme
- view mode

Use debounced saving.

Recommended debounce:

```text
300–500ms
```

Avoid writing to localStorage on every individual keystroke without debounce.

Restore saved content when the application loads.

---

## File Support

### Import

Support:

- `.md`
- `.markdown`

Allow:

- File picker
- Drag and drop

### Export

Export the current document as:

```text
filename.md
```

Sanitize generated filenames.

Also support PDF export of the rendered preview (see **PDF Export** below).

Do not implement HTML export unless requested.

---

# Non-Goals

Do not implement these features during MVP work unless explicitly requested:

- Authentication
- User accounts
- Backend API
- Database
- Cloud sync
- Real-time collaboration
- Comments
- Shared documents
- Version history
- AI writing
- AI autocomplete
- Payments
- Subscription systems

Avoid speculative architecture for future features.

Build the smallest clean implementation that satisfies current requirements.

---

# Application Architecture

Prefer a feature-oriented but lightweight project structure.

Suggested structure:

```text
src/
├── components/
│   ├── editor/
│   │   ├── MarkdownEditor.tsx
│   │   └── EditorToolbar.tsx
│   │
│   ├── preview/
│   │   └── MarkdownPreview.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Workspace.tsx
│   │   └── StatusBar.tsx
│   │
│   └── ui/
│
├── hooks/
│   ├── useAutoSave.ts
│   ├── useKeyboardShortcuts.ts
│   └── useLocalStorage.ts
│
├── lib/
│   ├── markdown.ts
│   ├── file.ts
│   └── storage.ts
│
├── types/
│   └── index.ts
│
├── constants/
│   └── index.ts
│
├── App.tsx
└── main.tsx
```

The exact structure may evolve, but keep responsibilities separated.

Do not create excessive abstraction layers for simple logic.

---

# Component Responsibilities

## MarkdownEditor

Responsible for:

- User Markdown input
- Selection handling
- Editor state
- Formatting commands
- Editor keyboard behavior

Do not perform Markdown rendering inside this component.

---

## MarkdownPreview

Responsible for:

- Receiving Markdown source
- Rendering Markdown
- Sanitizing output
- Displaying syntax-highlighted code blocks

Do not modify document state from the preview component.

---

## EditorToolbar

Responsible for:

- Triggering formatting commands
- Showing formatting controls
- Accessible labels/tooltips

Toolbar formatting logic should preferably be reusable rather than embedded directly into button components.

---

## Workspace

Responsible for:

- Layout
- Split/editor/preview modes
- Responsive panel behavior

Do not put Markdown parsing or file persistence logic here.

---

## StatusBar

Display useful lightweight document information such as:

- Word count
- Character count
- Line count
- Save status

Example:

```text
Words 124 · Characters 762 · Lines 38 · Saved
```

---

# TypeScript Rules

Use strict TypeScript.

Avoid:

```ts
any
```

unless absolutely unavoidable.

Prefer explicit types for:

- document state
- editor actions
- view modes
- theme values
- persistence payloads

Example:

```ts
type ViewMode = 'split' | 'editor' | 'preview';

type Theme = 'light' | 'dark';

interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

Prefer union types over arbitrary strings.

---

# React Rules

Use:

- Functional components
- Hooks
- Composition

Avoid class components.

Do not use `useEffect` for state that can be derived during rendering.

Avoid unnecessary state duplication.

For example, do not separately store:

```ts
markdown
previewHtml
```

if `previewHtml` can be derived from `markdown`.

Memoize expensive Markdown processing only when it provides measurable benefit.

Avoid premature optimization.

---

# State Management

Keep the canonical Markdown source in one place.

Recommended conceptual state:

```ts
interface EditorState {
  title: string;
  content: string;
  viewMode: ViewMode;
  theme: Theme;
}
```

Do not maintain multiple independent copies of the Markdown content.

Data flow should generally be:

```text
Editor input
   ↓
Canonical Markdown state
   ↓
Preview renderer
   ↓
Rendered preview
```

---

# Markdown Rendering

Rendering must be safe.

Do not directly inject arbitrary raw HTML from Markdown without sanitization.

Dangerous example:

```html
<script>alert("xss")</script>
```

This must never execute.

If HTML support is enabled, sanitize rendered output using a trusted sanitizer such as:

- DOMPurify

Prefer disabling raw HTML entirely unless required.

The preview renderer must treat user-generated Markdown as untrusted input.

---

# Security Requirements

Security requirements are mandatory.

## XSS

Prevent execution of:

- `<script>`
- inline event handlers
- `javascript:` URLs
- malicious embedded HTML

## Links

External links opened in new tabs should use appropriate protection:

```html
rel="noopener noreferrer"
```

## Files

Validate imported file types.

Do not execute imported file content.

Treat imported Markdown exclusively as text.

## localStorage

Never store:

- credentials
- access tokens
- secrets

The Markdown editor should not require sensitive information.

---

# Editor Commands

Markdown formatting should be implemented through reusable editor commands.

Example API shape:

```ts
applyBold();
applyItalic();
applyHeading(1);
applyLink();
applyCodeBlock();
```

Or:

```ts
applyMarkdownFormat('bold');
```

Avoid implementing similar string manipulation separately inside every toolbar button.

Formatting behavior should correctly handle:

- Current selection
- Empty selection
- Cursor placement after formatting
- Multiline selections

---

# Keyboard Shortcuts

Required shortcuts:

## Windows / Linux

```text
Ctrl + B        Bold
Ctrl + I        Italic
Ctrl + S        Save
Ctrl + Z        Undo
Ctrl + Shift+Z  Redo
```

## macOS

```text
Cmd + B        Bold
Cmd + I        Italic
Cmd + S        Save
Cmd + Z        Undo
Cmd + Shift+Z  Redo
```

`Ctrl/Cmd + S` should prevent the browser's default save-page behavior.

Do not override common browser shortcuts unless necessary.

---

# UI / UX Principles

The editor should feel lightweight and distraction-free.

Avoid:

- Excessive gradients
- Heavy animations
- Large decorative elements
- Dashboard-like clutter
- Unnecessary modal dialogs

Prefer:

- Clean spacing
- Clear typography
- Subtle borders
- Strong editor/preview hierarchy
- Familiar Markdown editor patterns

The document should remain the primary visual focus.

---

# Desktop Layout

Default layout:

```text
┌──────────────────────────────────────────────────────┐
│ Header                                               │
├──────────────────────────────────────────────────────┤
│ Toolbar                                              │
├─────────────────────────┬────────────────────────────┤
│                         │                            │
│ Editor                  │ Preview                    │
│                         │                            │
├─────────────────────────┴────────────────────────────┤
│ Status Bar                                           │
└──────────────────────────────────────────────────────┘
```

Editor and Preview should normally use approximately equal width.

Allow resizing only if explicitly requested.

---

# Mobile Layout

Do not render an unusably narrow split view.

Prefer:

```text
Editor | Preview
```

tabs.

The toolbar may become:

- horizontally scrollable
- grouped into a compact menu

but important writing actions should remain easily accessible.

---

# Accessibility

All interactive controls must be keyboard accessible.

Buttons must have descriptive accessible names.

Bad:

```tsx
<button>
  <BoldIcon />
</button>
```

Better:

```tsx
<button aria-label="Bold">
  <BoldIcon />
</button>
```

Maintain visible focus states.

Use semantic elements wherever possible.

Avoid relying only on color to communicate state.

---

# Styling Rules

Use Tailwind consistently.

Avoid mixing multiple styling approaches such as:

- Tailwind
- CSS Modules
- styled-components
- inline styles

unless there is a clear reason.

Prefer Tailwind utilities for application UI.

Extract repeated visual patterns into reusable components when repetition becomes meaningful.

Do not create a component merely to wrap one `<div>` unless it provides clear semantic or behavioral value.

---

# Theme

Support:

- Light
- Dark
- System default

On initial load:

1. Check saved user preference.
2. Otherwise use OS preference.

Persist explicit user choice.

Theme changes should not reset editor content.

---

# Auto Save

Auto-save must not interfere with typing.

Recommended flow:

```text
User edits Markdown
        ↓
Update React state
        ↓
Debounce
        ↓
Save document to localStorage
        ↓
Update "Saved" status
```

Possible save states:

```ts
type SaveStatus = 'saved' | 'saving' | 'unsaved';
```

Do not display misleading "Saved" status before persistence has completed.

---

# Document Statistics

Statistics should be derived from current Markdown.

Required:

- Characters
- Words
- Lines

Keep calculations lightweight.

Do not introduce heavy NLP dependencies merely for word count.

---

# File Import

When importing:

1. Validate extension.
2. Read as text.
3. Load content into editor state.
4. Update document title where appropriate.
5. Save imported state locally.

If imported content would overwrite unsaved current work, avoid silent destructive behavior.

---

# File Export

Use browser-native download mechanisms.

Export only the Markdown source.

Do not export rendered HTML when the user selects Markdown export.

Filename should default to the document title.

Example:

```text
My Document
```

becomes:

```text
my-document.md
```

Use a reasonable fallback:

```text
document.md
```

---

# PDF Export

PDF export prints the **rendered, sanitized preview** — never the raw Markdown source.

```text
Markdown source → Parser → Sanitization → Safe preview → Print document → PDF
```

Use the browser's print dialog ("Save as PDF") with print-specific CSS:

- Build a dedicated print-only container from the same sanitizing renderer as the preview.
- Hide all app UI (header, toolbar, editor, status bar, menus) with `@media print`.
- A4 portrait, white background and near-black text, even in dark mode.
- Avoid page breaks after headings and inside code blocks, blockquotes, images and table rows.
- Wrap long code lines; keep tables and images within the page width.
- Keep syntax highlight colors with `print-color-adjust: exact`.
- Do not append URLs after links.

Suggest the file name via `document.title` using the same sanitization rules (`my-document.pdf`, fallback `document.pdf`) and restore the original title afterwards.

Do not add PDF libraries (`jsPDF`, `html2pdf`, `pdfmake`, ...) unless the print approach clearly cannot meet a requirement.

The header offers a single keyboard-accessible Export menu: **Markdown (.md)** and **PDF (.pdf)**.

---

# Error Handling

Errors should be understandable and non-technical where possible.

Examples:

```text
Unable to open this file.
Only Markdown files are supported.
```

Avoid exposing raw JavaScript stack traces in the UI.

Development console logs are acceptable for debugging but should not substitute for user-facing error handling.

---

# Performance

The editor should remain responsive with reasonably large Markdown documents.

Target preview update latency:

```text
< 100ms
```

for normal documents when practical.

Use debounce or throttling only where needed.

Do not introduce artificial delay to basic editor input.

Avoid rerendering unrelated UI on every keystroke where easy to prevent.

---

# Testing

At minimum, test critical logic for:

- Markdown formatting
- Auto-save
- localStorage restoration
- File import
- File export filename generation
- Markdown sanitization
- View mode switching

Prioritize behavioral tests over implementation-detail tests.

Useful edge cases include:

```text
Empty document
Unicode/Korean text
Very long line
Large Markdown document
Markdown containing raw HTML
Markdown containing malicious script
Empty selection formatting
Multiline selection formatting
Corrupted localStorage value
```

---

# Coding Style

Prefer readable code over clever code.

Good:

```ts
function sanitizeFileName(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}
```

Avoid unnecessarily compressed code.

Use descriptive names.

Prefer:

```ts
markdownContent
selectedText
saveDocument
```

over:

```ts
data
value
handle
```

when the more descriptive name improves clarity.

---

# Functions

Functions should generally perform one clear responsibility.

Prefer early returns where they improve readability.

Example:

```ts
function importMarkdownFile(file: File) {
  if (!isMarkdownFile(file)) {
    showUnsupportedFileError();
    return;
  }

  // continue import
}
```

Avoid deeply nested conditional logic.

---

# Comments

Do not comment obvious code.

Bad:

```ts
// Set markdown content
setMarkdownContent(content);
```

Add comments when explaining:

- non-obvious behavior
- workarounds
- browser quirks
- algorithm decisions
- security-sensitive logic

Comments should explain **why**, not merely **what**.

---

# Dependency Policy

Before adding a dependency, determine whether the feature can reasonably be implemented with existing tools or browser APIs.

Add dependencies only when they provide meaningful value.

Avoid libraries for trivial operations such as:

- simple string formatting
- basic debounce logic
- basic file downloads

unless existing project dependencies already provide those utilities.

Do not add duplicate libraries serving the same role.

---

# Package Management

Use the package manager already configured in the project.

Do not create additional lockfiles.

Examples:

If the project contains:

```text
pnpm-lock.yaml
```

use:

```bash
pnpm
```

If it contains:

```text
package-lock.json
```

use:

```bash
npm
```

Do not switch package managers without explicit instruction.

---

# Before Making Changes

Before modifying the codebase:

1. Inspect existing structure.
2. Identify related components and utilities.
3. Reuse existing patterns.
4. Check current dependencies before adding new ones.
5. Avoid rewriting unrelated working code.

When fixing a bug, prefer the smallest correct change.

Do not refactor unrelated areas unless required for correctness.

---

# After Making Changes

After code changes:

1. Run TypeScript checks.
2. Run linting.
3. Run relevant tests.
4. Build the project.
5. Fix errors introduced by the change.

Typical commands may include:

```bash
npm run lint
npm run test
npm run build
```

Use the project's actual scripts rather than assuming these commands exist.

---

# Git Practices

Keep changes focused.

Avoid mixing unrelated refactors and feature changes.

Commit messages, when requested, should be concise and descriptive.

Examples:

```text
feat: add markdown file import
fix: sanitize rendered markdown html
refactor: extract editor formatting commands
```

Do not commit generated build output unless the repository already tracks it.

---

# Decision Priorities

When multiple approaches are possible, prefer the option that is:

1. Easier for users
2. Safer
3. Simpler
4. Easier to maintain
5. More consistent with the existing codebase
6. Less dependent on unnecessary third-party libraries

Do not optimize for theoretical future scale at the cost of current simplicity.

---

# Definition of Done

A feature is complete only when:

- It works for the intended user flow.
- TypeScript reports no relevant errors.
- Existing behavior is not broken.
- Relevant edge cases are handled.
- UI works in both light and dark themes where applicable.
- Keyboard interaction remains usable.
- Mobile behavior is reasonable.
- Security implications have been considered.
- No unnecessary dependencies or abstractions were introduced.

---

# MVP Acceptance Criteria

The MVP is considered complete when a user can:

1. Open the application.
2. Write Markdown.
3. See the rendered result in real time.
4. Apply common Markdown formatting.
5. Switch between editor, preview, and split views.
6. Refresh the page without losing their document.
7. Import a Markdown file.
8. Export the document as `.md` and as a print-friendly PDF.
9. Use light and dark themes.
10. Use common keyboard shortcuts.
11. View basic document statistics.
12. Use the application on desktop and mobile.
13. Render untrusted Markdown without executing malicious scripts.

---

# Final Principle

When implementing this project, always preserve the core experience:

```text
Write → Preview → Export (Markdown / PDF)
```

Do not allow secondary functionality to make this workflow slower, more complicated, or less reliable.

The Markdown editor should remain fast, focused, safe, and easy to understand.