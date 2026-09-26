import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Workspace } from './Workspace';

afterEach(cleanup);

// Rendered and not inside a `hidden` panel.
function isShown(text: string): boolean {
  return screen.getByText(text).closest('[hidden]') === null;
}

function renderWorkspace(viewMode: 'split' | 'editor' | 'preview', isDesktop: boolean) {
  return render(
    <Workspace
      viewMode={viewMode}
      isDesktop={isDesktop}
      toolbar={<div>toolbar</div>}
      editor={<div>editor content</div>}
      preview={<div>preview content</div>}
    />,
  );
}

describe('Workspace view modes', () => {
  it('shows editor, toolbar and preview side by side in split mode', () => {
    renderWorkspace('split', true);
    expect(isShown('editor content')).toBe(true);
    expect(isShown('preview content')).toBe(true);
    expect(isShown('toolbar')).toBe(true);
  });

  it('hides the preview in editor mode', () => {
    renderWorkspace('editor', true);
    expect(isShown('editor content')).toBe(true);
    expect(screen.queryByText('preview content')).toBeNull();
  });

  it('hides the editor and toolbar in preview mode but keeps the editor mounted', () => {
    renderWorkspace('preview', true);
    expect(isShown('preview content')).toBe(true);
    expect(isShown('editor content')).toBe(false);
    expect(screen.queryByText('toolbar')).toBeNull();
  });

  it('uses tabs instead of a split view on mobile', () => {
    renderWorkspace('split', false);
    expect(screen.getByRole('tab', { name: 'Editor' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByText('preview content')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(isShown('preview content')).toBe(true);
    expect(isShown('editor content')).toBe(false);
  });
});
