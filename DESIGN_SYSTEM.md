# Design System (Glass Notes Theme)

## Zielbild
Das UI folgt einem dunklen, frosted-glass Stil mit weichen Kontrasten, blauen Primary-Akzenten und dezenten gruenen Highlights, orientiert am bereitgestellten Screenshot.

## Token-Set
Alle Kernwerte laufen zentral ueber CSS-Variablen in `src/index.css`.

### Farben (semantisch)
- `--color-base`, `--color-base-elevated`: App-Hintergrund und Grundflaechen
- `--color-surface`, `--color-surface-2`, `--color-surface-3`: Glas-Surfaces fuer Cards/Panels/Inputs
- `--color-text`, `--color-muted`: Primar-/Sekundaertext
- `--color-primary`, `--color-primary-soft`: Primary Action + aktive Zustandsflaechen
- `--color-accent`, `--color-accent-soft`: Sekundaerer Akzent
- `--color-border`, `--color-border-strong`: Normal-/Hover-/aktive Randauspraegung
- `--color-focus`, `--color-focus-ring`: sichtbare Fokus-States
- `--color-success`, `--color-warning`, `--color-danger`, `--color-info`: Statusfarben

### Typografie
- Display: `Space Grotesk`
- Body: `Manrope`
- Mono: `JetBrains Mono`
- Hierarchie: klare Trennung ueber `font-display` (Headlines), Body-Texte und Mono-Werte fuer KPI/Datum

### Radius
- `--radius-input: 0.92rem`
- `--radius-button: 0.95rem`
- `--radius-card: 1.25rem`
- `--radius-modal: 1.72rem`

### Shadows / Glas-Effekte
- `--shadow-shell`, `--shadow-card`, `--shadow-soft`, `--shadow-hover`, `--shadow-glow`
- `backdrop-filter` wird fuer Surfaces, Buttons, Chips und Inputs genutzt
- Fallback: auch ohne Blur bleibt Kontrast und Lesbarkeit durch Layered-Backgrounds erhalten

### Motion
- Fast/Base/Slow Kurven ueber Variablen (`--motion-fast`, `--motion-base`, `--motion-slow`)
- Einheitliche Hover/Fokus/Pressed-Transitions fuer Buttons, Cards und Inputs

### Spacing-Charakteristik
- Dichtes, aber luftiges Grid mit kleinen bis mittleren Abstaenden (`gap-2`, `gap-3`, `gap-4`, `p-4`, `p-5`, `p-6`)
- Touch-freundliche Mindesthoehen fuer interaktive Controls

## Tailwind-Mapping
In `tailwind.config.cjs` sind semantische Tokens gemappt:
- Farben: `base`, `surface`, `text`, `muted`, `primary`, `accent`, `border`, `border-strong`, etc.
- Radius: ueber CSS-Variablen
- Shadows: `card`, `soft`, `glow`, `shell`
- Fonts: Display/Body/Mono

## UI-Komponenten (Primitives)
Neue zentrale UI-Schicht in `src/components/ui/`:
- `Button` (`primary`, `secondary`, `ghost`, `destructive`; `sm|md|lg|icon`; optional `loading`)
- `Input`, `Select`, `Textarea` mit optionalem `invalid`
- `Card`, `Panel`, `Badge`
- `cn` Utility fuer Klassenkomposition

## Interaktionszustaende
- `hover`: subtile Aufhellung/Border-Shift + leichte Elevation
- `active`: reduzierte Translation
- `focus-visible`: klarer Ring ueber `--color-focus-ring`
- `disabled`: reduzierte Opacity, kein Hover-Lift

## Responsive + PWA
- Mobile: Buttons/Inputs behalten ausreichende Touch-Targets
- Kleinere Screens: reduzierte Radien/kompaktere Shell
- Lesbarkeit bleibt in allen Themes erhalten

## Ergaenzte Annahmen (nicht direkt im Screenshot sichtbar)
- Light-Theme im gleichen Stil (frosted, reduzierte Kontraste), da Theme-Toggle bereits Teil der App ist
- Statusfarben als harmonisierte, gedimmte Varianten fuer den Glass-Look
- Einheitliche Select-Caret-Darstellung via CSS, um Plattformunterschiede zu reduzieren
