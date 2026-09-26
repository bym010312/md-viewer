import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '../ui/Button';
import { ChevronDownIcon, ExportIcon } from '../ui/icons';

interface ExportMenuProps {
  onExportMarkdown: () => void;
  onExportPdf: () => void;
}

/** Menu button following the WAI-ARIA menu button pattern. */
export function ExportMenu({ onExportMarkdown, onExportPdf }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const items = [
    { label: 'Markdown (.md)', accessibleLabel: 'Export as Markdown file', onSelect: onExportMarkdown },
    { label: 'PDF (.pdf)', accessibleLabel: 'Export as PDF', onSelect: onExportPdf },
  ];

  useEffect(() => {
    if (isOpen) itemRefs.current[focusedIndex]?.focus();
  }, [isOpen, focusedIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen]);

  function open(initialIndex: number) {
    setFocusedIndex(initialIndex);
    setIsOpen(true);
  }

  function closeAndFocusTrigger() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function selectItem(index: number) {
    closeAndFocusTrigger();
    items[index].onSelect();
  }

  function handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      open(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      open(items.length - 1);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent) {
    const lastIndex = items.length - 1;
    const keyToIndex: Record<string, number> = {
      ArrowDown: focusedIndex === lastIndex ? 0 : focusedIndex + 1,
      ArrowUp: focusedIndex === 0 ? lastIndex : focusedIndex - 1,
      Home: 0,
      End: lastIndex,
    };

    if (event.key in keyToIndex) {
      event.preventDefault();
      setFocusedIndex(keyToIndex[event.key]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeAndFocusTrigger();
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label="Export"
        title="Export document"
        onClick={() => (isOpen ? setIsOpen(false) : open(0))}
        onKeyDown={handleTriggerKeyDown}
      >
        <ExportIcon />
        <span className="hidden md:inline">Export</span>
        <ChevronDownIcon />
      </Button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Export format"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 z-20 mt-1 min-w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-label={item.accessibleLabel}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setFocusedIndex(index)}
              className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
