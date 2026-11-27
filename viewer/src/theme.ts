import type { Theme } from './types';

const STORAGE_KEY = 'gws-theme';

const META_COLOR: Record<Theme, string> = {
  dark: '#0a0d11',
  light: '#e6eaea',
};

/**
 * Returns the saved theme, else the operating system preference.
 */
export function getInitialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // Storage can be blocked; fall through to the system preference.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Applies the theme to the document and the browser chrome colour. Only an
 * explicit choice is saved, so an unset preference keeps following the system.
 */
export function applyTheme(theme: Theme, persist = false): void {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', META_COLOR[theme]);
  if (!persist) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore blocked storage.
  }
}
