# Job Tracker PWA

Offline-fähige Bewerbungs- & Planer-App (React + Vite + TypeScript). Alle Daten bleiben lokal (IndexedDB mit localStorage-Fallback). Kein Backend, keine Cloud.

## Browser-Unterstützung (Installation)

**Wichtiger Hinweis (Stand: Februar 2026):** Die App lässt sich als installierbare PWA nur in bestimmten Browsern installieren. Unten findest du eine klare Übersicht, wo es funktioniert – und wo nicht.

**Desktop (Windows/macOS/Linux) – unterstützt:**
- Chromium-Browser (z.B. Chrome, Edge, Brave, Opera)
- Safari auf macOS Sonoma (Safari 17+) über „Add to Dock“

**Desktop – nicht unterstützt:**
- Firefox (keine Manifest-Installation)

**Android – unterstützt:**
- Chrome, Edge, Firefox, Opera, Samsung Internet

**iOS/iPadOS – unterstützt:**
- iOS 16.3 und früher: nur Safari
- iOS 16.4 und später: Safari, Chrome, Edge, Firefox, Orion (über Teilen-Menü)

**Hinweis:** Der Installations-Button in der App erscheint nur, wenn der Browser den Install-Prompt unterstützt (meist Chromium). Auf iOS nutzt du „Teilen → Zum Home-Bildschirm“.

**Highlights**
- Offline nutzbar, installierbar als PWA
- Job-Tracker (CRUD), Filter, Suche, Sortierung
- Planer für Aufgaben/Termine pro Bewerbung
- Backup/Restore als JSON
- PDF-Export und Druckansicht mit Statusfarben
- Dark/Light-Theme (Dracula Theme im Dark Mode)

## Nutzung

**Bewerbungen anlegen**
- Klicke auf „Neue Bewerbung“ und fülle beliebige Felder aus.
- Keine Pflichtfelder: Speichern ist jederzeit möglich.

**Bearbeiten & Status**
- Bearbeiten über den Button „Bearbeiten“.
- Status direkt in der Karte ändern.
- Optional wird eine Status-Historie gepflegt.

**Filter & Sortierung**
- Suche nach Unternehmen oder Position.
- Filter nach Status und Zeitraum.
- Sortierung nach Datum, Status oder Follow-up.

**Follow-ups**
- Follow-up Datum optional setzen.
- Fällige Follow-ups erscheinen im Dashboard.

**Planer**
- Aufgaben/Termine pro Bewerbung anlegen.
- Filter: Heute, Diese Woche, Überfällig.

**Backup & Restore**
- Backup: Button `Backup` erzeugt eine JSON-Datei mit Versionsfeld.
- Restore: Button `Restore`, dann JSON-Datei auswählen.

**PDF-Export / Drucken**
- Button `PDF / Drucken` öffnet die druckoptimierte Tabellenansicht.
- Als PDF speichern oder direkt drucken.

## PWA-Installation

- Im Browser die Installations-Option nutzen (z.B. „App installieren“).
- Lokal im Projekt: `npm run build` und `npm run preview`, dann im Browser installieren.
- Die App läuft offline, sobald der Service Worker aktiv ist.

## Datenhaltung

- Primär: IndexedDB
- Fallback: localStorage
- Auto-Save nach Änderungen

## Technologien

- **React 18 + Vite**: schnelle Entwicklungsumgebung, moderne Build-Pipeline.
- **TypeScript**: typisierte Domänenmodelle, weniger Laufzeitfehler.
- **Tailwind CSS**: konsistentes UI-Design mit Theme-Variablen.
- **Zustand**: schlanker globaler State mit Auto-Save.
- **IndexedDB** (Fallback `localStorage`): robuste Offline-Speicherung.
- **Framer Motion**: animierte Listen und sanfte Übergänge.
- **react-to-print**: PDF/Druckansicht aus React-View.
- **Vitest + Testing Library**: Unit- & Basis-UI-Tests.

## Voraussetzungen

- Node.js 18+ empfohlen
- npm 9+

## Setup

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test
```

## Projektstruktur

```
public/
 ├─ icon.svg
 ├─ manifest.webmanifest
 ├─ offline.html
 └─ sw.js
src/
 ├─ components/
 │   ├─ ApplicationCard.tsx
 │   ├─ ApplicationForm.tsx
 │   ├─ ApplicationList.tsx
 │   ├─ Dashboard.tsx
 │   ├─ FiltersBar.tsx
 │   ├─ Planner.tsx
 │   ├─ PrintView.tsx
 │   ├─ Skeleton.tsx
 │   └─ StatusBadge.tsx
 ├─ services/
 │   ├─ export.ts
 │   ├─ logic.ts
 │   ├─ storage.ts
 │   └─ theme.ts
 ├─ store/
 │   └─ appStore.ts
 ├─ tests/
 │   ├─ export.test.ts
 │   ├─ logic.test.ts
 │   ├─ setup.ts
 │   ├─ storage.test.ts
 │   └─ ui.test.tsx
 ├─ App.tsx
 ├─ index.css
 ├─ main.tsx
 ├─ types.ts
 └─ vite-env.d.ts
```

### Ordnerstruktur im Detail

- `public/`
  - PWA-Assets: Manifest, Service Worker, Offline-HTML, App-Icon.
- `src/components/`
  - UI-Bausteine (Formular, Karten, Filter, Dashboard, Planer, PrintView).
  - Fokus auf Wiederverwendbarkeit, typisierte Props, minimaler Logikanteil.
- `src/services/`
  - Domänenlogik und Infrastruktur (Storage, Export, Theme).
  - Keine UI-Abhängigkeiten, sauber testbar.
- `src/store/`
  - Zustand-Store inkl. Aktionen, Auto-Save und Hydration.
- `src/tests/`
  - Unit-Tests für Logik & Storage, UI-Tests für Kernkomponenten.
- `src/types.ts`
  - Domänenmodelle: `JobApplication`, `Task`, `Settings`, `BackupFile`.

## Architektur & Logik (ausführlich)

### Domänenmodelle (`src/types.ts`)

- **JobApplication**
  - Kernobjekt für Bewerbungen inkl. Status, Follow-up, Kontakt, Notizen.
  - `createdAt` / `updatedAt` für zeitbasierte Filter und Statistiken.
  - `history` optional für Statuswechsel.

- **Task**
  - Aufgaben & Termine je Bewerbung (interview, reminder, task).
  - `done`-Status und optionales `dueDate` für Planner-Filter.

- **Settings**
  - Theme, Filter, Sortierung, Suche.
  - Persistiert für konsistentes Verhalten über Sessions.

- **BackupFile**
  - JSON-Struktur mit `version` und `createdAt`.
  - Erlaubt sauberen Restore und spätere Migrationen.

### Logik-Schicht (`src/services/logic.ts`)

Enthält reine Funktionen (testbar, UI-unabhängig):

- **CRUD & Statuswechsel**
  - `createApplication`, `addApplication`, `updateApplication`, `deleteApplication`
  - `changeStatus` ergänzt optional eine Status-Historie.

- **Follow-up-Logik**
  - `calculateFollowUpDate`: generiert Follow-up abhängig vom Status.
  - Wird beim Statuswechsel ergänzt, wenn kein Follow-up gesetzt ist.

- **Filter & Sortierung**
  - `filterApplications` prüft Status, Zeitraum und Suchbegriff.
  - `sortApplications` nach Datum, Status oder Follow-up.

- **Dashboard**
  - `getDashboardStats` berechnet:
    - Gesamtanzahl
    - Status-Verteilung
    - Woche/Monat
    - Verlauf der letzten 6 Monate
    - fällige Follow-ups

- **Backup/Restore**
  - `buildBackup` erzeugt die JSON-Struktur mit Version.
  - `restoreBackup` validiert und normalisiert Daten.

### Storage (`src/services/storage.ts`)

- **IndexedDB first**, fallback auf `localStorage`.
- Einheitliche API: `load`, `save`, `clear`.
- Fehlerbehandlung via `try/catch`, falls IndexedDB nicht verfügbar ist.

### Store (`src/store/appStore.ts`)

- Zentraler Zustand, Aktionen für alle Kernfälle.
- Auto-Save mit kurzem Debounce (250ms).
- `hydrate` lädt vorhandene Daten und setzt Theme.

### Print/Export (`src/services/export.ts` + `PrintView`)

- `buildExportRows` wandelt Bewerbungen in tabellarische Daten.
- `PrintView` erstellt Druckansicht mit Statusfarben.

### Theme (`src/services/theme.ts`)

- Theme wird auf `data-theme` gesetzt.
- Dark/Light-Toggle wird persistiert.

## Lizenz

Dieses Projekt ist unter der **MIT License** lizenziert. Siehe `LICENSE` für den vollständigen Text.

## Footer / Credits

- Lizenz: MIT
- Erstellt von **Dimitri B** mit Unterstützung von **Codex Agenten**
- GitHub-Repository: `https://github.com/Web-Developer-DB/Job-Tracker`
