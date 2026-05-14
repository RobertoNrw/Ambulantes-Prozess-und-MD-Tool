# Infinite Canvas v0.19 - Interoperability Bridge Edition

Ein professionelles Infinite Canvas Board mit KI-Organisation und intelligenter Datenvernetzung.

## 🚀 Neue Features in v0.19

### 🔗 Interoperability Bridge
Das neue Modul verbindet dein Board mit der Außenwelt:

- **📤 Multi-Format Export**: JSON, Markdown, CSV, Mermaid Diagramme
- **📥 Smart Import**: Importiere aus JSON, Markdown oder Mermaid Graph TD
- **🔍 Referenz-Erkennung**: Findet automatisch URLs, Emails, @Mentions, #Tags
- **🔌 API Generator**: Erstellt Swagger/OpenAPI Spec für deine Board-Daten
- **📋 Clipboard Integration**: Copy & Paste von Board-Inhalten

### 🤖 AI Organizer (v0.18)
KI-gestützte Board-Analyse und Organisation:

- **📊 Cluster erkennen**: Findet zusammenhängende Node-Gruppen
- **🏝️ Inseln finden**: Identifiziert Nodes ohne Verbindungen
- **🔄 Duplikate**: Erkennt gleiche oder ähnliche Nodes
- **📐 Auto-Layout**: Optimiert die Anordnung aller Nodes

## 🎯 Bedienung

### Toolbar
- **+ Node**: Neue Nodes hinzufügen (10 Typen verfügbar)
- **🤖 AI**: AI Organizer öffnen
- **🔗 Bridge**: Interoperability Bridge (Export/Import/Referenzen)
- **🔍 Suche**: Spotlight-Suche (⌘K)
- **⊞ Tpl**: Templates laden
- **🕰️ Backups**: Time Machine für Versionen

### Shortcuts
| Taste | Aktion |
|-------|--------|
| `Dblclick` | Node erstellen |
| `Shift+Drag` | Nodes verbinden |
| `⌘K` | Suche öffnen |
| `D` | Duplizieren |
| `L` | Lock Node |
| `1` | Fit to Screen |
| `Strg+Z` | Undo |
| `Strg+Y` | Redo |
| `Esc` | Modal schließen |

## 📦 Node-Typen

1. **Text** - Markdown-fähige Textnodes
2. **Sticky** - Farbige Notizen
3. **Checkliste** - To-do Listen mit Checkboxen
4. **Gruppe** - Container für Nodes
5. **Tabelle** - Dynamische Tabellen
6. **Bild** - Upload & Paste von Bildern
7. **Link-Bubble** - URLs mit Vorschau
8. **Raute** - Entscheidungssymbole
9. **Ellipse** - Prozessschritte
10. **Hexagon** - Module

## 🔗 Interoperability Features

### Export Formate
- **JSON**: Vollständige Datenstruktur für Backups
- **Markdown**: Lesbare Dokumentation mit Node-Hierarchie
- **CSV**: Tabellenkalkulation für Excel/Sheets
- **Mermaid**: Diagramm-Syntax für GitHub/GitLab Docs

### Import Quellen
- **Datei-Upload**: JSON, .md, .txt Dateien
- **Clipboard**: Direkt einfügen mit Strg+V
- **Auto-Erkennung**: Format wird automatisch erkannt

### Referenz-Analyse
Das Board scannt alle Nodes nach:
- 🔗 URLs und Domains
- 📧 Email-Adressen
- 👥 @Mentions (Team-Mitglieder)
- 🏷️ #Tags (Schlagwörter)

Jede gefundene Referenz kann direkt angesteuert werden.

## 🛠️ Technik

- **StorageManager**: Lokale Speicherung mit Fallback
- **imgCache**: Effizientes Bild-Caching
- **AIOrganizer**: Pattern Recognition im Browser
- **InteropBridge**: Multi-Format Konverter & Parser
- **Time Machine**: Server-Backups via api.php
- **WCAG 2.1 AA**: Barrierefreiheit integriert

## 📁 Dateien

- `index.html` - Hauptanwendung (alles in einer Datei)
- `api.php` - Backend für Backups & Sync
- `data/` - Speicherort für JSON-Backups

## 🔧 Entwicklung

Die Anwendung ist als Single-File-Lösung konzipiert. Alle Änderungen können direkt in `index.html` vorgenommen werden.

### Code-Struktur
```javascript
// Kernmodule
- StorageManager    // Lokale Persistenz
- AIOrganizer       // KI-Analyse (v0.18)
- InteropBridge     // Export/Import/Referenzen (v0.19)
- API-Funktionen    // Backend-Kommunikation

// Rendering
- render()          // Haupt-Renderloop
- drawGrid()        // Grid-Zeichnung
- drawNode()        // Node-Rendering

// Interaktion
- Pointer Events    // Maus/Touch
- Keyboard          // Shortcuts
- Context Menu      // Rechtsklick-Menü
```

### Module erweitern
Neue Export-Formate im `InteropBridge.exportToFormat()` hinzufügen:
```javascript
exportToFormat(format) {
  // ... bestehende Formate ...
  case 'neues-format':
    // Eigene Logik hier
    return generatedOutput;
}
```

## 📈 Versionshistorie

- **v0.19** - Interoperability Bridge, Multi-Format Export/Import
- **v0.18** - AI Organizer, Pattern Recognition, Auto-Layout
- **v0.17** - StorageManager Fallback, Bugfixes

## 📄 Lizenz

© 2026 Roberto Bonavita
