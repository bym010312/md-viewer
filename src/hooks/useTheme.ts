import { useEffect } from 'react';
import type { ResolvedTheme, ThemePreference } from '../types';
import { useMediaQuery } from './useMediaQuery';

/** Resolves the "system" preference and applies the theme to the document root. */
export function useTheme(preference: ThemePreference): ResolvedTheme {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedTheme: ResolvedTheme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return resolvedTheme;
}
