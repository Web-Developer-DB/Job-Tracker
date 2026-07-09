/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Manrope"', 'system-ui', 'sans-serif'],
        body: ['"Manrope"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        base: 'var(--color-base)',
        'base-elevated': 'var(--color-base-elevated)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-3': 'var(--color-surface-3)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        primary: 'var(--color-primary)',
        'primary-soft': 'var(--color-primary-soft)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        info: 'var(--color-info)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        focus: 'var(--color-focus)'
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        soft: 'var(--shadow-soft)',
        glow: 'var(--shadow-glow)',
        shell: 'var(--shadow-shell)'
      },
      borderRadius: {
        xl: 'var(--radius-card)',
        '2xl': 'var(--radius-modal)',
        '3xl': 'calc(var(--radius-modal) + 0.2rem)'
      }
    }
  },
  plugins: []
};
