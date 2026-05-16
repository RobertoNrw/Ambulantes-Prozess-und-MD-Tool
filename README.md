# Infinite Canvas v0.24 - Productivity Boost Edition

Ein professionelles Infinite Canvas Board mit KI-Organisation, P2P-Sync und intelligenter Datenvernetzung.

## 🚀 Neue Features in v0.24

### ⌨️ Discoverability
- **`?` Hilfe-Modal**: Übersichtliches Shortcuts-Panel mit allen Tastenkürzeln und Tipps
- **Toolbar-Button ❓**: Hilfe auch per Klick erreichbar

### 📤 Erweiterter Export
- **SVG-Export** (`S` oder Toolbar): Skalierbare Vektorgrafik für Dokumentationen
- **Sofort-Speichern** (`Strg+S`): Direkter Save zu Lokal + Server

### 🎯 Workflow-Booster
- **Auto-Grid** (`G`): Ausgewählte Nodes automatisch in Raster anordnen
- **Focus Mode** (`F`): Selektion auf voller Canvas-Fläche zentrieren
- **Group Drag**: Gruppen verschieben jetzt alle enthaltenen Nodes mit

### 🔍 Spotlight Power-Suche
- **Type-Filter**: `type:sticky Notiz` zeigt nur passende Sticky-Notes
- Unterstützt alle 10 Node-Typen: text, sticky, checklist, group, table, link, diamond, ellipse, hexagon, image

### 🐛 Bug Fixes
- Markdown-Import korrigiert (`.md` wird nicht mehr als Mermaid fehlinterpretiert)
- Versionsnummern konsistent über alle Dateien

---

## 🎯 Bedienung

### Toolbar
- **+ Node**: Neue Nodes hinzufügen (10 Typen)
- **🤖 AI**: AI Organizer (Cluster, Inseln, Auto-Layout, Duplikate)
- **🔗 Bridge**: Interoperability Bridge (Export/Import/Referenzen)
- **📤 Share**: P2P Share Dock & Live Room
- **🔍 Suche**: Spotlight-Suche (`Strg+K`)
- **⊞ Tpl**: Templates laden
- **🕰️ Backups**: Time Machine für Versionen
- **❓ Hilfe**: Tastatur-Shortcuts (`?`)

### Wichtige Shortcuts

| Taste | Aktion |
|-------|--------|
| `?` | Hilfe-Panel öffnen |
| `Dblclick` | Node erstellen |
| `Shift+Drag` | Nodes verbinden |
| `Strg+K` | Spotlight-Suche |
| `Strg+S` | Sofort speichern |
| `D` | Duplizieren |
| `L` | Sperren |
| `G` | Auto-Grid für Auswahl |
| `F` | Fokus auf Selektion |
| `S` | SVG-Export |
| `N` | Neuer Text-Node |
| `1` | Fit to Screen |
| `Strg+Z` | Undo |
| `Strg+Y` | Redo |
| `Esc` | Modal schließen |

### Spotlight-Suchsyntax

```
type:sticky          → alle Sticky-Notes
type:checklist Test  → Checklisten mit "Test" im Titel
type:link            → alle Link-Bubbles
Suchwort             → Volltextsuche
```

---

## 📦 Node-Typen

1. **Text** – Markdown-fähig (#, ##, **bold**, *italic*, `code`)
2. **Sticky** – Farbige Notizen (6 Farben)
3. **Checkliste** – To-do mit Checkboxen
4. **Gruppe** – Container, zieht Inhalt mit
5. **Tabelle** – Dynamisch mit Zeilen/Spalten
6. **Bild** – Upload, Paste, Drag&Drop
7. **Link-Bubble** – URLs mit Favicon
8. **Raute** – Entscheidungssymbole
9. **Ellipse** – Prozessschritte
10. **Hexagon** – Module

---

## 🔗 Interoperability

### Export-Formate
- **JSON** – vollständige Datenstruktur
- **SVG** – skalierbare Vektorgrafik (**neu in v0.24**)
- **PNG** – 2× hochauflösend
- **Markdown** – lesbare Dokumentation
- **CSV** – Excel/Sheets
- **Mermaid** – GitHub/GitLab Docs

### Import-Quellen
- Datei-Upload (`.json`, `.md`, `.markdown`, `.mmd`, `.csv`)
- Clipboard (Strg+V mit Auto-Erkennung)
- Drag & Drop direkt aufs Canvas

### Referenz-Analyse
Automatische Erkennung von URLs, Emails, @Mentions, #Tags in allen Nodes.

---

## 🛠️ Technik

| Modul | Zweck |
|-------|-------|
| `StorageManager` | Lokale Persistenz mit Memory-Fallback |
| `AIOrganizer` | Cluster-, Insel-, Duplikat-Erkennung, Auto-Layout |
| `InteropBridge` | Multi-Format-Konverter (JSON/MD/CSV/Mermaid/SVG) |
| `P2PShare` | Lokaler Datenaustausch |
| `LiveRoom` | WebRTC-basierte Echtzeit-Kollaboration (PeerJS) |
| `PredictiveWorkflow` | Pattern-Erkennung & Macro-Vorschläge |
| `api.php` | Backend für Server-Sync & Time-Machine |

WCAG 2.1 AA konform · Dark/Light-Mode · 60fps-Rendering mit `requestAnimationFrame` · Viewport-Culling.

---

## 📁 Dateien

- `index.html` – HTML-Struktur & Dialoge
- `app.js` – Anwendungslogik (Canvas-Rendering, Module, Events)
- `style.css` – Styling & Theming
- `api.php` – Backend (Backups & Sync)
- `data/` – JSON-Speicher

---

## 📈 Versionshistorie

- **v0.24** – SVG-Export, Auto-Grid, Focus Mode, Help-Panel, Spotlight-Filter, Group-Drag-Fix
- **v0.23** – Predictive Workflow, Macro-Vorschläge
- **v0.22** – Live Room (WebRTC)
- **v0.20** – P2P Share
- **v0.19** – Interoperability Bridge
- **v0.18** – AI Organizer
- **v0.17** – StorageManager-Fallback

---

## 📄 Lizenz

© 2026 Roberto Bonavita
