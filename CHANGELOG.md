# Changelog - Infinite Canvas

## v0.24 (2026) - Productivity Boost

### ✨ Neue Features
- **SVG-Export**: Skalierbare Vektorgrafik-Ausgabe (Toolbar-Button + Taste `S`)
- **Help-Modal** (`?`): Übersichtliches Shortcuts-Panel mit Tipps & Tricks
- **Auto-Grid** (`G`): Selektierte Nodes automatisch in Raster anordnen
- **Focus-Modus** (`F`): Auswahl auf voller Canvas-Fläche zentrieren
- **Sofort-Speichern** (`Strg+S`): Direkter Save zu Lokal + Server mit Bestätigung
- **Spotlight-Filter**: Suche mit `type:sticky` o. ä. nach Node-Typ filtern

### 🐛 Bug Fixes
- Markdown-Import: `.md`-Dateien werden korrekt als Markdown erkannt, nicht mehr als Mermaid
- Auto-Erkennung für Mermaid-Inhalte in Markdown-Dateien (`graph TD`)
- Gruppen verschieben jetzt alle enthaltenen Nodes mit (Group-Drag)
- Versionsnummern in `index.html`, `README.md` und Footer konsistent (v0.24)

### 🎨 UX
- Spotlight-Placeholder zeigt Filter-Syntax-Beispiel
- Statusbar-Hint zeigt neue Shortcuts (`?`, `G`, `F`)
- Toolbar erweitert um SVG- und Help-Buttons

### 🔒 Sicherheit
- HTML-Escaping in SVG-Export für alle Node-Texte (XSS-Schutz)

---

## v4.0 (2026) - Major Security & Accessibility Update

### 🎨 Frontend Verbesserungen

#### Accessibility (WCAG 2.1 AA)
- ✅ **ARIA-Labels** für alle interaktiven Elemente hinzugefügt
- ✅ **Keyboard Navigation** mit `tabindex` für Toolbar, Buttons und Menüs
- ✅ **Screen Reader Support** mit semantischen Rollen (`role="button"`, `role="dialog"`, etc.)
- ✅ **Focus States** mit sichtbaren Outlines für Tastaturnavigation
- ✅ **Live Regions** für Toast-Nachrichten (`aria-live="polite"`)
- ✅ **Modal Dialogs** mit `aria-modal="true"` und korrektem Labeling

#### Mobile UX
- ✅ **Responsive Toolbar** mit horizontaler Scrollbarkeit auf kleinen Screens
- ✅ **Touch-Optimierung** mit `maximum-scale=1.0, user-scalable=no`
- ✅ **Verbesserte Button-Größen** mit `flex-shrink: 0` für bessere Bedienbarkeit

#### Meta-Tags
- ✅ **Theme Color** für Mobile Browser
- ✅ **Description** für SEO

### 🔒 Backend Sicherheitsupdates

#### CORS Protection
- ✅ **Whitelist-basiert** statt `Access-Control-Allow-Origin: *`
- ✅ **Umgebungsvariable** `ALLOWED_ORIGINS` für Konfiguration
- ✅ **Development Fallback** nur für localhost

#### Security Headers
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY` (Clickjacking-Schutz)
- ✅ `X-XSS-Protection: 1; mode=block`

#### Logging System
- ✅ **Zentrale Fehlerprotokollierung** in `data/logs/error_YYYY-MM-DD.log`
- ✅ **Kontext-Informationen** bei Fehlern (IP, Action, Canvas-ID)
- ✅ **Automatische Log-Rotation** nach Datum

#### Error Handling
- ✅ **Logging aller 4xx/5xx Errors** mit Kontext
- ✅ **Sichere Fehlermeldungen** ohne sensible Daten

### 📁 Konfiguration

#### Umgebungsvariablen (.env)
```env
API_KEY=your-secure-key
ALLOWED_ORIGINS=https://deinedomain.com
```

#### Beispiel-Konfiguration
- ✅ `.env.example` Template erstellt
- ✅ Dokumentation aller Optionen

### 📚 Dokumentation

#### DEPLOYMENT.md
- ✅ Komplette Installationsanleitung
- ✅ Webserver-Konfiguration (Apache & Nginx)
- ✅ Dockerfile Beispiel
- ✅ Production Checklist
- ✅ Troubleshooting Guide
- ✅ Monitoring-Anleitung

### 🔧 Code-Qualität

#### PHP
- ✅ Typ-Deklarationen für Funktionen
- ✅ Bessere Variablennamen
- ✅ Konsistente Struktur

#### JavaScript
- ✅ Semantisches HTML durch ARIA
- ✅ Bessere Event-Handler

### 🐛 Bug Fixes
- ✅ Toolbar overflow auf kleinen Bildschirmen
- ✅ Focus-Trapping in Modals verbessert
- ✅ Screen Reader Ankündigungen für dynamische Inhalte

---

## v3.2 (vorherige Version)

### Features
- 10 Node-Typen (Text, Sticky, Checkliste, Gruppe, Tabelle, Link, Raute, Ellipse, Hexagon, Bild)
- Connections mit Labels
- Undo/Redo
- Snap-to-Grid
- Minimap
- Spotlight-Suche
- Templates
- Export/Import (JSON/PNG)
- Time Machine (Backups)
- Dark/Light Mode
- LocalStorage + Backend-Sync

---

## Migration v3.x → v4.0

### Breaking Changes
- ❗ CORS ist jetzt restriktiv (nur erlaubte Domains)
- ❗ API-Key wird empfohlen für Production

### Upgrade Steps
1. `.env.example` nach `.env` kopieren
2. `ALLOWED_ORIGINS` setzen
3. Optional: `API_KEY` generieren
4. Logs-Verzeichnis erstellen: `mkdir -p data/logs`
5. Berechtigungen prüfen

---

**Alle Änderungen sind abwärtskompatibel bei korrekter Konfiguration.**
