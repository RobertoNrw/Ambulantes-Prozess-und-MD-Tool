# Infinite Canvas v0.18 - AI Organizer Edition

Ein professionelles Infinite Canvas Board mit KI-gestützter Organisation.

## 🚀 Neue Features in v0.18

### 🤖 AI Organizer
Das neue AI-Modul analysiert dein Board und hilft bei der Organisation:

- **📊 Cluster erkennen**: Findet zusammenhängende Node-Gruppen basierend auf Connections
- **🏝️ Inseln finden**: Identifiziert Nodes ohne Verbindungen
- **🔄 Duplikate**: Erkennt gleiche oder ähnliche Nodes
- **📐 Auto-Layout**: Optimiert die Anordnung aller Nodes für bessere Lesbarkeit

## 🎯 Bedienung

### Toolbar
- **+ Node**: Neue Nodes hinzufügen (10 Typen verfügbar)
- **🤖 AI**: AI Organizer öffnen
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

## 🛠️ Technik

- **StorageManager**: Lokale Speicherung mit Fallback
- **imgCache**: Effizientes Bild-Caching
- **AIOrganizer**: Pattern Recognition im Browser
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
- AIOrganizer       // KI-Analyse
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

## 📄 Lizenz

© 2026 Roberto Bonavita
