import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, resolveInitialTheme } from '../services/theme';

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('theme service', () => {
  it('applies theme to document root', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('uses stored theme when provided', () => {
    expect(resolveInitialTheme('light')).toBe('light');
  });

  it('falls back to system preference when no stored theme exists', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    expect(resolveInitialTheme()).toBe('dark');
  });
});
