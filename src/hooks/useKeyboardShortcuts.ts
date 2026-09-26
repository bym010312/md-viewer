import { useEffect, useEffectEvent } from 'react';

interface KeyboardShortcutHandlers {
  onSave: () => void;
}

/**
 * App-wide shortcuts. Editor-specific shortcuts (bold, italic, undo, redo)
 * live in the CodeMirror keymap so they only apply while editing.
 */
export function useKeyboardShortcuts({ onSave }: KeyboardShortcutHandlers): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const isModifierPressed = event.metaKey || event.ctrlKey;
    if (isModifierPressed && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's') {
      // Stop the browser's "Save page as" dialog.
      event.preventDefault();
      onSave();
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
