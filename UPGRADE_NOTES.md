# Upgrade Notes

## Zielumgebung
- Empfohlene Node-Version (LTS): `>=22.12.0`
- Package Manager: `npm`
- Lockfile: `package-lock.json` (einziges Lockfile beibehalten)

## Wichtige Upgrades
- React: `18.x` -> `19.2.0`
- React DOM: `18.x` -> `19.2.0`
- react-to-print: `2.x` -> `3.3.0`
- framer-motion: `11.x` -> `12.34.3`
- zustand: `4.x` -> `5.0.11`
- Tailwind CSS: `3.x` -> `4.2.1`
- Tailwind PostCSS Plugin: neu `@tailwindcss/postcss@4.2.1`
- Vite React Plugin: `4.x` -> `5.1.4`
- Testing: `@testing-library/react` `14.x` -> `16.3.2`, `jsdom` `24.x` -> `28.1.0`
- TypeScript: `5.4.x` -> `5.9.3`
- Node Types: `@types/node` -> `22.x` (LTS-Linie)
- Security Patch: `rollup` auf gepatchte `4.59+` Linie gehoben

## Relevante Breaking-Change Fixes
- `react-to-print` v3 API-Migration:
  - `useReactToPrint({ content: ... })` ersetzt durch `useReactToPrint({ contentRef })`.
- Tailwind v4 PostCSS-Migration:
  - `postcss.config.cjs` von `tailwindcss` auf `@tailwindcss/postcss` umgestellt.
  - `src/index.css` von `@tailwind base/components/utilities` auf:
    - `@import 'tailwindcss';`
    - `@config '../tailwind.config.cjs';`
  - Bestehende Tailwind-Konfiguration bleibt erhalten, damit Klassen/Design-Tokens unverändert funktionieren.

## Starten / Bauen / Testen
- Installieren:
  - `npm install`
- Entwicklung:
  - `npm run dev`
- Build:
  - `npm run build`
- Tests:
  - `npm run test -- --run`

## Ergebnisprotokoll
- Erfolgreich ausgeführt:
  - `npm install`
  - `npm run build`
  - `npm run test -- --run`
  - `npm run dev` (Start erfolgreich, Server erreichbar)
- Sicherheitsstatus:
  - `npm audit` zeigt keine offenen Vulnerabilities.
