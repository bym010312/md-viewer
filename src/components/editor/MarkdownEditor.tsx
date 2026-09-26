import { defaultKeymap, history, historyKeymap, redo } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Annotation, EditorState, Prec } from '@codemirror/state';
import { EditorView, drawSelection, keymap, placeholder } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref } from 'react';
import { applyMarkdownFormat } from '../../lib/editorCommands';
import type { MarkdownFormat } from '../../types';

export interface MarkdownEditorHandle {
  applyFormat: (format: MarkdownFormat) => void;
  focus: () => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  ref?: Ref<MarkdownEditorHandle>;
}

/** Marks transactions that sync content coming from outside (e.g. file import). */
const externalChange = Annotation.define<boolean>();

// Colors come from CSS variables (see index.css) so the editor follows the
// light/dark theme without reconfiguring CodeMirror.
const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: '700', color: 'var(--md-heading)' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: [tags.link, tags.url], color: 'var(--md-link)' },
  { tag: tags.monospace, color: 'var(--md-code)' },
  { tag: tags.quote, color: 'var(--md-quote)' },
  { tag: [tags.processingInstruction, tags.contentSeparator, tags.meta], color: 'var(--md-mark)' },
]);

const editorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--editor-fg)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.7',
  },
  '.cm-content': { padding: '16px 0', caretColor: 'var(--editor-cursor)' },
  '.cm-line': { padding: '0 20px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--editor-cursor)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--editor-selection)',
  },
  '.cm-placeholder': { color: 'var(--md-mark)' },
});

function runFormat(view: EditorView, format: MarkdownFormat): boolean {
  const { from, to } = view.state.selection.main;
  const formatEdit = applyMarkdownFormat(view.state.doc.toString(), { from, to }, format);
  view.dispatch({
    changes: { from: formatEdit.from, to: formatEdit.to, insert: formatEdit.insert },
    selection: formatEdit.selection,
    scrollIntoView: true,
    userEvent: 'input.format',
  });
  return true;
}

export function MarkdownEditor({ value, onChange, ref }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const handleDocumentChange = useEffectEvent((newValue: string) => onChange(newValue));

  // The editor is created once. `value` is only read here for the initial
  // document; later external changes are synced by the effect below.
  useEffect(() => {
    if (!containerRef.current) return;

    const formatKeymap = keymap.of([
      { key: 'Mod-b', run: (view) => runFormat(view, 'bold') },
      { key: 'Mod-i', run: (view) => runFormat(view, 'italic') },
      // historyKeymap binds Ctrl-Shift-Z only on Linux/macOS; on Windows it would fall back to undo.
      { key: 'Mod-Shift-z', run: redo, preventDefault: true },
    ]);

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          EditorView.lineWrapping,
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(markdownHighlightStyle),
          editorTheme,
          placeholder('Start writing Markdown…'),
          // Higher precedence so Mod-i overrides CodeMirror's default "select parent syntax".
          Prec.high(formatKeymap),
          // Tab is intentionally not bound, so keyboard users can still tab out of the editor.
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.contentAttributes.of({ 'aria-label': 'Markdown editor', spellcheck: 'false' }),
          EditorView.domEventHandlers({
            // Dropped files are handled by the app-level Markdown import instead of
            // CodeMirror's default behavior of inserting the file contents inline.
            drop: (event) => (event.dataTransfer?.files.length ?? 0) > 0,
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const isExternal = update.transactions.some((transaction) => transaction.annotation(externalChange));
            if (!isExternal) handleDocumentChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;

    // Kept in undo history so an import can be reverted with Ctrl/Cmd+Z.
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      selection: { anchor: 0 },
      annotations: externalChange.of(true),
    });
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      applyFormat: (format) => {
        const view = viewRef.current;
        if (!view) return;
        runFormat(view, format);
        view.focus();
      },
      focus: () => viewRef.current?.focus(),
    }),
    [],
  );

  return <div ref={containerRef} className="h-full min-h-0" />;
}
