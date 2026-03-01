# 📝 Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.  
Das Format orientiert sich an **Keep a Changelog** und **Semantic Versioning (SemVer)**.

---

## [Unreleased] 🚧

### Hinzugefügt ✨
- 📘 Dokumentation des neuen Design-Systems: `DESIGN_SYSTEM.md`
- 🧭 Separates UI-Änderungsprotokoll: `CHANGELOG_UI.md`
- 💾 JSON-Backup speichert in unterstützten Browsern jetzt über Datei-Dialog (`showSaveFilePicker`) mit auswählbarem Speicherort und Dateinamen.
- 📝 Neue Migrationsdokumentation für Toolchain-/Dependency-Upgrade: `UPGRADE_NOTES.md`

### Geändert 🔁
- 🗂️ Reihenfolge im Hauptlayout angepasst: Die Komponente **Planer** steht jetzt direkt unter **Suche und Fokus**.
- 🧾 Druck-/PDF-Layout überarbeitet: klarere Spaltenbreiten, bessere Abstände, Status als lesbare Chips, zusätzliche Metadaten und optimierte A4-Druckränder.
- 🎨 Komplettes UI-Redesign im Glas-/Blur-Stil (angelehnt an Referenz-Screenshot): neue Farbpalette, Typo (Space Grotesk/Manrope), Radius- und Shadow-Skalen, konsistente Hover/Focus/Disabled-States.
- 🧱 Zentrale UI-Primitives eingeführt (`Button`, `Input/Select/Textarea`, `Card/Panel/Badge`) und App-weit auf semantische Tokens + Tailwind-Mapping migriert.
- 🪟 App-Shell mit frosted Hintergrund, klareren Abständen und Touch-freundlichen Controls; Light-/Dark-Theme harmonisiert.
- ⬆️ Toolchain und Abhängigkeiten auf aktuelle stabile Linien gehoben (u. a. React 19, Tailwind 4, TypeScript 5.9, Zustand 5, Framer Motion 12, Testing-Libs aktualisiert).
- 🔧 Node-Engine auf LTS-Ziel angehoben: `>=22.12.0`.
- 🧵 Tailwind-PostCSS-Integration auf v4-Muster migriert (`@tailwindcss/postcss`, CSS-Einstieg via `@import 'tailwindcss'` + `@config`).
- 🖥️ Desktop-Layout deutlich fokussierter gemacht: zentrale Content-Breite begrenzt (`980px`) und auf großen Screens mit theme-abhängigen Seitenflächen ergänzt.
- 🧭 Header-Interaktion neu geordnet: klare rechte „Schnellaktionen“-Spalte mit prominentem CTA „Neue Bewerbung“.
- ♻️ Redundante Desktop-Steuerleiste entfernt; Suche/Filter sind jetzt kontextnah im Bereich „Bewerbungen im Überblick“ integriert.

### Behoben 🛠️
- 🖨️ Druckdialog in installierter Chrome-PWA (Windows): Mehrfaches Drucken funktioniert wieder zuverlässig; der zweite Klick auf „PDF / Drucken“ öffnet erneut den Druckdialog.
- 🖨️ `react-to-print`-Migration auf v3 API (`contentRef`) für Build-Kompatibilität.
- 🔐 Build-Audit bereinigt: Rollup auf gepatchte Version angehoben (Sicherheitswarnung entfernt).
- 🧯 Fallback-Hinweis beim Backup-Export ergänzt: In Browsern ohne Speicherort-Auswahl wird Download weiter genutzt und transparent kommuniziert.
- 📏 KPI-Ausrichtung im Header korrigiert: Kennzahlen bleiben trotz Zeilenumbruch in Labels sauber auf einer Linie.
- 🏷️ Follow-ups-Badge (`x offen`) ohne unschöne Umbrüche ausgerichtet (`nowrap` + spacing).

### UX Mobile Report 📱

#### Bedienpfade (Hauptflows)
- Übersicht/Liste: bestehende Bewerbungen scannen, Status prüfen, Eintrag bearbeiten oder löschen.
- Neu erstellen: neue Bewerbung erfassen, speichern, sofort in der Liste sichtbar.
- Bearbeiten: bestehende Bewerbung öffnen, Felder ändern, speichern.
- Löschen: Bewerbung entfernen (mit Sicherheitsabfrage).
- Filter/Suche/Sortierung: Suchbegriff setzen, Status/Zeitraum/Sortierung anpassen, Trefferzahl prüfen.

#### Gefundene Mobile UX-Reibungen
- Primäre Aktionen (Neu, Suche, Filter) waren nicht dauerhaft in der Daumen-Zone erreichbar.
- Erstellen/Filtern lag nur als lange Seitenbereiche vor; auf kleinen Screens war der Weg zu Aktionen unnötig lang.
- Such-/Filterzustand war auf Mobile nicht sticky im Listenkontext und aktive Filter nicht kompakt sichtbar.
- Feedback nach Speichern/Löschen war inkonsistent (nur punktuell, kein einheitliches Toast-Muster).
- Touch-Targets für Inputs/Buttons waren teilweise knapp unter 44px (z. B. kompakte Number-Inputs).

#### Umgesetzte Mobile UX-Patterns
- Mobile Action Bar (`md:hidden`) mit Aktionen: `Neu`, `Suche`, `Filter`.
- Bottom Sheet für mobile `Neu` und `Filter/Sortierung` inkl. Body Scroll Lock, Fokus auf Close/Initial-Focus, Escape-Schließen und scrollfähigem Sheet-Body.
- Sticky Mobile-Suche im Listenbereich (`sticky top-2`) mit aktiven Filter-Chips und direktem Entfernen per `x`.
- Einheitliches Toast-System mit Auto-Dismiss (ca. 4-5s) und Action-Button `Undo` für Löschvorgang.
- Mobile Form-UX verbessert: min. 44px Touch-Targets, passende `type`/`inputMode` (`search`, `url`, `numeric`), Inline-Fehler für URL, Fokus auf erstes invalides Feld beim Submit.
- Safe-Area-Unterstützung: Action Bar mit `env(safe-area-inset-bottom)` und Content-Padding unten für freie letzte Listeneinträge.

#### Geprüfte Screens/Abschnitte
- Header + Quick Actions
- Dashboard
- Formular (Neu/Bearbeiten)
- Filter/Suche/Sortierung
- Planer
- Bewerbungsliste inkl. Leerzustände
- Footer

#### Scroll-Bug: Ursache und Fix
- Hauptauslöser 1: Horizontales Driften durch visuelle Overflow-Effekte (absolut positionierte/geblaurte Shell-Dekoration) in Kombination mit fehlender globaler X-Clip-Absicherung.
- Hauptauslöser 2: „Stufiges“ Scroll-Gefühl durch teure visuelle Effekte auf Mobile (breit eingesetztes Backdrop-Blur).
Umgesetzte Fixes:
- Globaler X-Overflow-Schutz auf `html`, `body`, `#root`, `.app-shell` mit `overflow-x: clip` und Fallback `overflow-x: hidden`.
- Stabilität durch `min-width: 0` auf zentralen Container-Klassen (`.app-frame`, `.card`, `.card-soft`), `max-width: 100%` für `.app-frame` und zusätzliche `break-words` bei langen Texten.
- Scroll-Interaktion über `touch-action: pan-y` auf Hauptscrollcontainer (`.app-shell`) verbessert.
- Mobile Performance verbessert: Backdrop-Blur für zentrale Elemente auf kleinen Screens deaktiviert.
- Animationslast reduziert: `layout`-Animation an List-Items entfernt.

#### Smoke-Test Liste
- `npm run build` läuft erfolgreich (Bundle erzeugt).
- `npm run dev` lokal starten: fehlgeschlagen in dieser Umgebung wegen Node 18 (`Vite 7 braucht >=20.19/22.12`).
- Mobile Device-Mode/echtes Gerät in dieser CLI-Umgebung nicht direkt reproduzierbar.
- Voller `vitest`-Lauf blockiert in dieser Umgebung durch ESM/Worker-Fehler (`ERR_REQUIRE_ESM` in jsdom-Abhängigkeit).
- Codepfade für Liste, Neu, Edit, Löschen/Undo, Filter-Sheet und Sticky-Suche wurden implementiert.
- Keine bewusst eingeführten Änderungen an Datenmodell/API/Business-Regeln.

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
