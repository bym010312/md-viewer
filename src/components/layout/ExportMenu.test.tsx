import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExportMenu } from './ExportMenu';

afterEach(cleanup);

function renderMenu() {
  const onExportMarkdown = vi.fn();
  const onExportPdf = vi.fn();
  render(<ExportMenu onExportMarkdown={onExportMarkdown} onExportPdf={onExportPdf} />);
  const trigger = screen.getByRole('button', { name: 'Export' });
  return { trigger, onExportMarkdown, onExportPdf };
}

describe('ExportMenu', () => {
  it('opens on click, focuses the first item and runs the chosen export', () => {
    const { trigger, onExportPdf, onExportMarkdown } = renderMenu();
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Export as Markdown file' }));

    fireEvent.click(screen.getByRole('menuitem', { name: 'Export as PDF' }));
    expect(onExportPdf).toHaveBeenCalledOnce();
    expect(onExportMarkdown).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('supports arrow keys and closes with Escape', () => {
    const { trigger } = renderMenu();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Export as PDF' }));

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Export as Markdown file' }));

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when clicking outside', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
