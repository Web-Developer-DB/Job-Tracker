# UI Refactor Changelog

## Scope
Nur visuelle Anpassungen (Design/System/Styling/Komponentenstruktur), ohne Aenderung der Business-Logik.

## Angepasste Bereiche

### Theme/Tokens
- `src/index.css`
  - Komplettes Token-Set auf dunklen Glassmorphism-Stil umgestellt
  - Konsistente States fuer Buttons/Inputs/Cards/Chips
  - App-Shell (`app-shell`, `app-frame`) eingefuehrt
  - Fokus-, Hover-, Disabled- und Motion-Strategie zentralisiert
- `tailwind.config.cjs`
  - Semantische Farben erweitert (`border-strong`, `focus`)
  - Shadow-/Radius-/Font-Mapping auf neue Tokens aktualisiert

### UI-Primitives (neu)
- `src/components/ui/cn.ts`
- `src/components/ui/Button.tsx`
- `src/components/ui/Field.tsx`
- `src/components/ui/Surface.tsx`
- `src/components/ui/index.ts`

### App-weite Migration
- `src/App.tsx`
  - Header-Actions auf `Button` migriert
  - Chips auf `Badge` migriert
  - Shell-/Layout-Styling auf Screenshot-nahe Form gebracht
- `src/components/ApplicationForm.tsx`
  - Inputs/Selects/Textarea auf Primitives migriert
  - Aktionsbuttons auf Varianten (`primary|secondary|ghost`) migriert
- `src/components/ApplicationCard.tsx`
  - Task-/Card-Actions auf `Button` migriert
  - Edit-Controls auf `Input`/`Select` migriert
- `src/components/ApplicationList.tsx`
  - Empty-State Action auf `Button` migriert
- `src/components/FiltersBar.tsx`
  - Filterfelder auf `Input`/`Select` migriert
  - Reset auf `Button` migriert
- `src/components/Planner.tsx`
  - Segmented Toggle + Formularfelder + Aktionen auf Primitives migriert
- `src/components/Dashboard.tsx`
  - Chips auf `Badge` migriert
  - Wochenziel-Input auf `Input` migriert
  - Statusfarben stilistisch angepasst
- `src/components/StatusBadge.tsx`
  - Statuspalette auf neues Theme abgestimmt
- `src/components/Skeleton.tsx`
  - Shell-Look konsistent zum neuen App-Frame

## Verifikation
- `npm run test:run`: 44/44 Tests bestanden
- `npm run build`: erfolgreich (Vite meldet weiterhin lokale Node-Version-Warnung)

## Annahmen und kreative Ergaenzungen
- Screenshot zeigt primar Dark-Glass UI; Light-Theme wurde im gleichen visuellen System harmonisiert
- Nicht sichtbare Komponentenstates wurden aus dem Stil abgeleitet (dezent, weich, niedrige Kontrastspruenge)
- Blur-Effekt sparsam und mit robustem visuellen Fallback umgesetzt
