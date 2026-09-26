import {
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_SETTINGS,
  DOCUMENT_STORAGE_KEY,
  SAMPLE_MARKDOWN,
  SETTINGS_STORAGE_KEY,
} from '../constants';
import type { EditorSettings, MarkdownDocument, ThemePreference, ViewMode } from '../types';

const THEME_VALUES: readonly ThemePreference[] = ['light', 'dark', 'system'];
const VIEW_MODE_VALUES: readonly ViewMode[] = ['split', 'editor', 'preview'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJson(key: string): unknown {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue === null ? null : JSON.parse(rawValue);
  } catch {
    // Corrupted JSON or storage blocked (e.g. privacy mode) — treat as missing.
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded or storage unavailable.
    return false;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createDocument(title: string, content: string): MarkdownDocument {
  const now = new Date().toISOString();
  return { id: createId(), title, content, createdAt: now, updatedAt: now };
}

export function createSampleDocument(): MarkdownDocument {
  return createDocument(DEFAULT_DOCUMENT_TITLE, SAMPLE_MARKDOWN);
}

export function parseStoredDocument(value: unknown): MarkdownDocument | null {
  if (!isRecord(value)) return null;
  if (typeof value.content !== 'string') return null;

  const now = new Date().toISOString();
  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    title: typeof value.title === 'string' ? value.title : '',
    content: value.content,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  };
}

export function parseStoredSettings(value: unknown): EditorSettings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };

  const theme = THEME_VALUES.find((candidate) => candidate === value.theme);
  const viewMode = VIEW_MODE_VALUES.find((candidate) => candidate === value.viewMode);
  return {
    theme: theme ?? DEFAULT_SETTINGS.theme,
    viewMode: viewMode ?? DEFAULT_SETTINGS.viewMode,
    // Settings saved before scroll sync existed have no value; keep the default.
    scrollSync: typeof value.scrollSync === 'boolean' ? value.scrollSync : DEFAULT_SETTINGS.scrollSync,
  };
}

/**
 * Returns the saved document, or the sample document on first run.
 * A saved document with empty content is restored as-is so the sample
 * never reappears after the user intentionally clears the editor.
 */
export function loadDocument(): MarkdownDocument {
  return parseStoredDocument(readJson(DOCUMENT_STORAGE_KEY)) ?? createSampleDocument();
}

export function saveDocument(markdownDocument: MarkdownDocument): boolean {
  return writeJson(DOCUMENT_STORAGE_KEY, markdownDocument);
}

export function loadSettings(): EditorSettings {
  return parseStoredSettings(readJson(SETTINGS_STORAGE_KEY));
}

export function saveSettings(settings: EditorSettings): boolean {
  return writeJson(SETTINGS_STORAGE_KEY, settings);
}
