import { useEffect, useCallback, useRef, useMemo } from 'react';

// Types for keyboard shortcuts
interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param shortcuts - Array of shortcut definitions
 * @param options - Configuration options
 */
export const useKeyboardShortcuts = (
  shortcuts: ShortcutHandler[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options;
  
  // Create stable references that won't change
  const shortcutsRef = useRef(shortcuts);
  const optionsRef = useRef({ enabled, preventDefault });
  
  // Update refs when values change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    optionsRef.current = { enabled, preventDefault };
  }, [enabled, preventDefault]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { enabled: isEnabled, preventDefault: shouldPrevent } = optionsRef.current;
    if (!isEnabled) return;
    
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Use the current shortcuts from ref (always up-to-date)
    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? event.metaKey : true;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (shouldPrevent) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Predefined shortcuts for Flashcards component
 */
export const useFlashcardShortcuts = (
  currentIndex: number,
  totalCards: number,
  onPrev: () => void,
  onNext: () => void,
  onFlip: () => void,
  onShuffle?: () => void,
  enabled: boolean = true
) => {
  const shortcuts: ShortcutHandler[] = [
    {
      key: 'ArrowLeft',
      action: () => {
        if (currentIndex > 0) onPrev();
      },
      description: 'Previous card',
    },
    {
      key: 'ArrowRight',
      action: () => {
        if (currentIndex < totalCards - 1) onNext();
      },
      description: 'Next card',
    },
    {
      key: ' ', // Space
      action: onFlip,
      description: 'Flip card',
    },
    {
      key: 'f',
      action: onFlip,
      description: 'Flip card',
    },
  ];

  if (onShuffle) {
    shortcuts.push({
      key: 's',
      action: onShuffle,
      description: 'Shuffle cards',
    });
  }

  useKeyboardShortcuts(shortcuts, { enabled });
};

/**
 * Predefined shortcuts for Quiz component
 */
export const useQuizShortcuts = (
  onSelectAnswer: (index: number) => void,
  onSubmit: () => void,
  onNext: () => void,
  hasSelected: boolean,
  isSubmitted: boolean,
  enabled: boolean = true
) => {
  // Use useMemo to recreate shortcuts only when dependencies change
  const shortcuts = useMemo(() => [
    {
      key: '1',
      action: () => {
        if (!isSubmitted) onSelectAnswer(0);
      },
      description: 'Select option 1',
    },
    {
      key: '2',
      action: () => {
        if (!isSubmitted) onSelectAnswer(1);
      },
      description: 'Select option 2',
    },
    {
      key: '3',
      action: () => {
        if (!isSubmitted) onSelectAnswer(2);
      },
      description: 'Select option 3',
    },
    {
      key: '4',
      action: () => {
        if (!isSubmitted) onSelectAnswer(3);
      },
      description: 'Select option 4',
    },
    {
      key: 'Enter',
      action: () => {
        if (isSubmitted) {
          onNext();
        } else if (hasSelected) {
          onSubmit();
        }
      },
      description: 'Submit/Next',
    },
  ], [onSelectAnswer, onSubmit, onNext, hasSelected, isSubmitted]);

  useKeyboardShortcuts(shortcuts, { enabled });
};

/**
 * Predefined shortcuts for Navigation
 */
export const useNavigationShortcuts = (
  goHome: () => void,
  enabled: boolean = true
) => {
  const shortcuts: ShortcutHandler[] = [
    {
      key: 'h',
      action: goHome,
      description: 'Go home',
    },
    {
      key: 'Escape',
      action: goHome,
      description: 'Go back/close',
    },
  ];

  useKeyboardShortcuts(shortcuts, { enabled });
};

// Utility to format shortcut key for display
export const formatShortcutKey = (shortcut: ShortcutHandler): string => {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('⌘');
  
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  if (key === 'ArrowLeft') key = '←';
  if (key === 'ArrowRight') key = '→';
  if (key === 'ArrowUp') key = '↑';
  if (key === 'ArrowDown') key = '↓';
  
  parts.push(key.toUpperCase());
  return parts.join(' + ');
};

export default useKeyboardShortcuts;
