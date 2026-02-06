import type { ThemeMode } from '../types';

// Theme-Attribut an <html> setzen, damit CSS-Variablen greifen.
export const applyTheme = (theme: ThemeMode): void => {
  document.documentElement.setAttribute('data-theme', theme);
};

// Start-Theme bestimmen: gespeicherte Einstellung oder System-Präferenz.
export const resolveInitialTheme = (stored?: ThemeMode): ThemeMode => {
  if (stored) return stored;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};
