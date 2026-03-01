# UX Mobile Report

## Bedienpfade (Hauptflows)
- Uebersicht/Liste: bestehende Bewerbungen scannen, Status pruefen, Eintrag bearbeiten oder loeschen.
- Neu erstellen: neue Bewerbung erfassen, speichern, sofort in der Liste sichtbar.
- Bearbeiten: bestehende Bewerbung oeffnen, Felder aendern, speichern.
- Loeschen: Bewerbung entfernen (mit Sicherheitsabfrage).
- Filter/Suche/Sortierung: Suchbegriff setzen, Status/Zeitraum/Sortierung anpassen, Trefferzahl pruefen.

## Gefundene Mobile UX-Reibungen
- Primaere Aktionen (Neu, Suche, Filter) waren nicht dauerhaft in der Daumen-Zone erreichbar.
- Erstellen/Filtern lag nur als lange Seitenbereiche vor; auf kleinen Screens war der Weg zu Aktionen unnoetig lang.
- Such-/Filterzustand war auf Mobile nicht sticky im Listenkontext und aktive Filter nicht kompakt sichtbar.
- Feedback nach Speichern/Loeschen war inkonsistent (nur punktuell, kein einheitliches Toast-Muster).
- Touch-Targets fuer Inputs/Buttons waren teilweise knapp unter 44px (z. B. kompakte Number-Inputs).

## Umgesetzte Mobile UX-Patterns
- Mobile Action Bar (`md:hidden`) mit Aktionen: `Neu`, `Suche`, `Filter`.
- Bottom Sheet fuer mobile `Neu` und `Filter/Sortierung` inkl.:
  - Body Scroll Lock waehrend offen
  - Fokus auf Close/Initial-Focus
  - Escape schliesst
  - scrollfaehiger Sheet-Body
- Sticky Mobile-Suche im Listenbereich (`sticky top-2`) mit aktiven Filter-Chips und direktem Entfernen per `x`.
- Einheitliches Toast-System mit Auto-Dismiss (ca. 4-5s) und Action-Button `Undo` fuer Loeschvorgang.
- Mobile Form-UX verbessert:
  - min. 44px Touch-Targets
  - passende `type`/`inputMode` (z. B. `search`, `url`, `numeric`)
  - Inline-Fehler fuer URL
  - Fokus auf erstes invalides Feld beim Submit
- Safe-Area-Unterstuetzung:
  - Action Bar mit `env(safe-area-inset-bottom)`
  - Content-Padding unten fuer freie letzte Listeneintraege

## Gepruefte Screens/Abschnitte
- Header + Quick Actions
- Dashboard
- Formular (Neu/Bearbeiten)
- Filter/Suche/Sortierung
- Planer
- Bewerbungsliste inkl. Leerzustaende
- Footer

## Scroll-Bug: Ursache und Fix
### Hauptausloeser
- Horizontales Driften entstand durch visuelle Overflow-Effekte (absolut positionierte/geblaurte Shell-Dekoration) in Kombination mit fehlender globaler X-Clip-Absicherung.
- Das „stufige“ Scroll-Gefuehl wurde durch teure visuelle Effekte auf Mobile (breit eingesetztes Backdrop-Blur) verstaerkt.

### Umgesetzte Fixes
- Globaler X-Overflow-Schutz auf `html`, `body`, `#root`, `.app-shell`:
  - bevorzugt `overflow-x: clip`, Fallback `overflow-x: hidden`
- Stabilitaet:
  - `min-width: 0` auf zentralen Container-Klassen (`.app-frame`, `.card`, `.card-soft`)
  - `max-width: 100%` fuer `.app-frame`
  - zusaetzliche `break-words` an laengeren Textstellen in Karten
- Scroll-Interaktion:
  - `touch-action: pan-y` auf dem Hauptscrollcontainer (`.app-shell`)
- Mobile Performance:
  - Backdrop-Blur fuer zentrale Elemente auf kleinen Screens deaktiviert
- Animationslast reduziert:
  - `layout`-Animation an List-Items entfernt

## Smoke-Test Liste
- [x] `npm run build` laeuft erfolgreich (Bundle erzeugt).
- [ ] `npm run dev` lokal starten: fehlgeschlagen in dieser Umgebung wegen Node 18 (`Vite 7 braucht >=20.19/22.12`).
- [ ] Mobile Device-Mode/echtes Geraet in dieser CLI-Umgebung nicht direkt reproduzierbar.
- [ ] Voller `vitest`-Lauf blockiert in dieser Umgebung durch ESM/Worker-Fehler (`ERR_REQUIRE_ESM` in jsdom-Abhaengigkeit).
- [x] Codepfade fuer: Liste, Neu, Edit, Loeschen/Undo, Filter-Sheet und Sticky-Suche wurden implementiert.
- [x] Keine bewusst eingefuehrten Aenderungen an Datenmodell/API/Business-Regeln.
