<div align="center">
  <img src="public/icon.svg" alt="Job Tracker Icon" width="96" />

  # 💼 Job Tracker PWA

  <p>
    Offline-first Bewerbungs- und Planer-App mit <b>React 19</b>, <b>TypeScript</b> und <b>Vite</b>.<br />
    Ohne Backend und ohne Cloud – Bewerbungsdaten bleiben lokal im Browser. 🔒
  </p>

  <p>
    <a href="https://job-tracker-three-iota.vercel.app/"><b>🚀 Live-Demo öffnen</b></a>
    ·
    <a href="https://github.com/Web-Developer-DB/Job-Tracker"><b>Quellcode</b></a>
  </p>

  <p>
    <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-8A2BE2?style=for-the-badge" />
    <img alt="Offline" src="https://img.shields.io/badge/offline-first-00C853?style=for-the-badge" />
    <img alt="React" src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" />
    <img alt="License" src="https://img.shields.io/badge/License-MIT-FF6F00?style=for-the-badge" />
  </p>
</div>

---

## Über das Projekt

Der Job Tracker ist ein eigenständig entwickeltes Portfolio-Projekt zur strukturierten Verwaltung kompletter Bewerbungsprozesse. Die Anwendung verbindet Bewerbungs-Tracking, Follow-ups, Aufgabenplanung, Statistiken, Backup/Restore und eine druckoptimierte Bewerbungsübersicht in einer installierbaren PWA.

Ein Schwerpunkt liegt auf Datenschutz und Offline-Nutzung: Die Anwendung benötigt weder Benutzerkonto noch Server. Daten werden lokal in IndexedDB gespeichert; falls IndexedDB nicht verfügbar ist, dient `localStorage` als Fallback.

## ✨ Features

- 📴 **Offline-First / PWA** mit Service Worker und Offline-Fallback
- 🔒 **Lokale Datenspeicherung** ohne Backend, Cloud oder Account
- 🗃️ **Bewerbungsverwaltung (CRUD)** mit Statushistorie
- 🔎 **Suche, Filter und Sortierung**
- 🗓️ **Planer** für Aufgaben und Termine pro Bewerbung
- ⏰ **Follow-ups** mit automatischen Datumsvorschlägen und Fälligkeitsübersicht
- 📊 **Dashboard und Statistiken** inklusive Statusverteilung und Monatsverlauf
- 🎯 **Wochenziel** für Bewerbungsaktivitäten
- 🧾 **Backup & Restore** als versionierte JSON-Datei
- 🖨️ **PDF / Drucken** über eine eigene druckoptimierte Ansicht
- 🌙 **Dark/Light Mode**
- 📱 **Responsive UI** für Desktop und mobile Geräte
- 🧪 **Tests** mit Vitest und Testing Library

## 🧩 Technologien

- **React 19 + Vite 7** – UI und Build-Pipeline
- **TypeScript 5** – typisierte Domänenmodelle und robuste Anwendungslogik
- **Tailwind CSS 4** – responsives Design und Theme-Variablen
- **Zustand 5** – globaler State mit Hydration und Auto-Save
- **IndexedDB** mit `localStorage`-Fallback – lokale Persistenz
- **Framer Motion** – Animationen und Übergänge
- **react-to-print** – Druck-/PDF-Workflow
- **Vitest + Testing Library** – Unit- und UI-Tests

## 🧠 Architektur

Die Anwendung trennt UI, Geschäftslogik, State und Persistenz bewusst voneinander:

- `src/components/` – UI-Komponenten und responsive Ansichten
- `src/components/mobile/` – mobile Interaktionsmuster
- `src/components/ui/` – wiederverwendbare UI-Bausteine
- `src/services/logic.ts` – testbare Domänenlogik für CRUD, Status, Follow-ups, Filter, Statistiken und Restore-Normalisierung
- `src/services/storage.ts` – einheitliche Storage-Abstraktion für IndexedDB und `localStorage`
- `src/services/date.ts` – Datumsnormalisierung und Hilfsfunktionen
- `src/services/export.ts` / `fileSave.ts` – Export- und Backup-Funktionen
- `src/store/appStore.ts` – Zustand-Store mit Auto-Save und Hydration
- `src/tests/` – Tests für Logik, Store, Storage, UI, Komponenten und Druckansicht
- `src/types.ts` – zentrale Domänenmodelle

## 🧪 Qualität & Tests

Die Tests decken unter anderem folgende Bereiche ab:

- Bewerbungs- und Aufgaben-CRUD
- Statushistorie und Follow-up-Logik
- Filterung und Sortierung
- Dashboard-Statistiken
- Backup/Restore und Daten-Normalisierung
- Storage und Store-Verhalten
- UI- und Komponentenverhalten
- Druckansicht

```bash
npm run test:run
```

Für einen Produktions-Build:

```bash
npm run build
```

## 🚀 Lokale Entwicklung

### Voraussetzungen

- Node.js **>= 22.12.0**
- npm **10+**

```bash
npm install
npm run dev
```

Preview des Produktions-Builds:

```bash
npm run build
npm run preview
```

## 📲 PWA

Die Anwendung kann in unterstützten Browsern als PWA installiert werden. Auf Desktop-Systemen funktioniert die Installation insbesondere in Chromium-basierten Browsern; auf Mobilgeräten erfolgt die Installation über die jeweilige Browser-/Home-Screen-Funktion.

Der Service Worker wird nur im Production-Build registriert.

## 🧾 Datenschutz

Der Job Tracker überträgt keine Bewerbungsdaten an einen Server. Bewerbungen, Kontakte, Notizen, Aufgaben und Einstellungen verbleiben lokal im Browser. Für Datensicherung und Gerätewechsel steht ein JSON-Backup mit Restore-Funktion zur Verfügung.

## 🪪 Lizenz & Credits

- Lizenz: **MIT**
- Autor: **Dimitri B**
- Entwicklung mit Unterstützung von **Codex-Agenten**

---

**Live-Demo:** https://job-tracker-three-iota.vercel.app/
