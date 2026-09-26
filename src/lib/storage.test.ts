import { beforeEach, describe, expect, it } from 'vitest';
import { DOCUMENT_STORAGE_KEY, SAMPLE_MARKDOWN, SETTINGS_STORAGE_KEY } from '../constants';
import { createDocument, loadDocument, loadSettings, saveDocument, saveSettings } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('document persistence', () => {
  it('shows the sample document on first run', () => {
    expect(loadDocument().content).toBe(SAMPLE_MARKDOWN);
  });

  it('restores a saved document', () => {
    const saved = createDocument('Notes', '# 안녕하세요');
    saveDocument(saved);
    expect(loadDocument()).toEqual(saved);
  });

  it('does not bring the sample back after the user cleared the document', () => {
    saveDocument(createDocument('Empty', ''));
    expect(loadDocument().content).toBe('');
  });

  it('falls back to the sample when stored data is corrupted', () => {
    localStorage.setItem(DOCUMENT_STORAGE_KEY, '{not json');
    expect(loadDocument().content).toBe(SAMPLE_MARKDOWN);

    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify({ content: 42 }));
    expect(loadDocument().content).toBe(SAMPLE_MARKDOWN);
  });

  it('fills in missing optional fields', () => {
    localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify({ content: 'text' }));
    const restored = loadDocument();
    expect(restored.content).toBe('text');
    expect(restored.title).toBe('');
    expect(typeof restored.id).toBe('string');
  });
});

describe('settings persistence', () => {
  it('defaults to system theme and split view', () => {
    expect(loadSettings()).toEqual({ theme: 'system', viewMode: 'split' });
  });

  it('restores saved settings', () => {
    saveSettings({ theme: 'dark', viewMode: 'preview' });
    expect(loadSettings()).toEqual({ theme: 'dark', viewMode: 'preview' });
  });

  it('replaces invalid values with defaults', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme: 'neon', viewMode: 'editor' }));
    expect(loadSettings()).toEqual({ theme: 'system', viewMode: 'editor' });

    localStorage.setItem(SETTINGS_STORAGE_KEY, '[]');
    expect(loadSettings()).toEqual({ theme: 'system', viewMode: 'split' });
  });
});
