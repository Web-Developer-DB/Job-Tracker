# 📝 Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.  
Das Format orientiert sich an **Keep a Changelog** und **Semantic Versioning (SemVer)**.

---

## [Unreleased] 🚧

### Hinzugefügt ✨
- 📘 Dokumentation des neuen Design-Systems: `DESIGN_SYSTEM.md`
- 🧭 Separates UI-Änderungsprotokoll: `CHANGELOG_UI.md`

### Geändert 🔁
- 🗂️ Reihenfolge im Hauptlayout angepasst: Die Komponente **Planer** steht jetzt direkt unter **Suche und Fokus**.
- 🧾 Druck-/PDF-Layout überarbeitet: klarere Spaltenbreiten, bessere Abstände, Status als lesbare Chips, zusätzliche Metadaten und optimierte A4-Druckränder.
- 🎨 Komplettes UI-Redesign im Glas-/Blur-Stil (angelehnt an Referenz-Screenshot): neue Farbpalette, Typo (Space Grotesk/Manrope), Radius- und Shadow-Skalen, konsistente Hover/Focus/Disabled-States.
- 🧱 Zentrale UI-Primitives eingeführt (`Button`, `Input/Select/Textarea`, `Card/Panel/Badge`) und App-weit auf semantische Tokens + Tailwind-Mapping migriert.
- 🪟 App-Shell mit frosted Hintergrund, klareren Abständen und Touch-freundlichen Controls; Light-/Dark-Theme harmonisiert.

### Behoben 🛠️
- 🖨️ Druckdialog in installierter Chrome-PWA (Windows): Mehrfaches Drucken funktioniert wieder zuverlässig; der zweite Klick auf „PDF / Drucken“ öffnet erneut den Druckdialog.

---

## [0.1.0] — 2026-02-06 🎉

### Hinzugefügt ✨
- 💼 Job-Tracker (CRUD) für Bewerbungen inkl. Statuswechsel
- 🔎 Suche, Filter (Status/Zeitraum) & Sortierung
- 🗓️ Planer für Aufgaben/Termine pro Bewerbung (Heute/Diese Woche/Überfällig)
- ⏰ Follow-up-Datum + Dashboard-Übersicht für fällige Follow-ups
- 📴 PWA (Service Worker + Offline-Seite) und installierbares Manifest
- 🗄️ Lokale Datenhaltung (IndexedDB) mit `localStorage`-Fallback
- 🧾 Backup & Restore als JSON (inkl. Version-Feld)
- 🖨️ Druck-/PDF-Ansicht mit Statusfarben
- 🌙 Dark/Light-Theme (Dracula-inspirierter Dark Mode)
- 🧪 Test-Suite (Vitest + Testing Library) für Logik, Storage & grundlegende UI-Tests
