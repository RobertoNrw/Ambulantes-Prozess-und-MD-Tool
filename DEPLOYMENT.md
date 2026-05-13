# Infinite Canvas v4.0 - Deployment Guide

## 🚀 Installation

### 1. Voraussetzungen
- PHP 7.4 oder höher
- Schreibrechte für das `data/` Verzeichnis
- Webserver (Apache, Nginx, etc.)

### 2. Konfiguration

#### Umgebungsvariablen setzen
Kopiere `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

**Wichtige Einstellungen:**

| Variable | Beschreibung | Empfohlen |
|----------|--------------|-----------|
| `API_KEY` | API-Key für Schreibzugriffe | Zufälliger String (mind. 32 Zeichen) |
| `ALLOWED_ORIGINS` | Erlaubte Domains für CORS | Deine Produktionsdomain |

#### API-Key generieren
```bash
# Linux/Mac
openssl rand -base64 32

# Oder in PHP
php -r "echo bin2hex(random_bytes(32));"
```

### 3. Berechtigungen setzen

```bash
# Verzeichnisse erstellen
mkdir -p data/canvases data/revisions data/logs

# Schreibrechte setzen (für den Webserver-User)
chown -R www-data:www-data data/
chmod -R 755 data/
```

### 4. Webserver-Konfiguration

#### Apache (.htaccess)
```apache
<FilesMatch "\.(json|php)$">
    Require all granted
</FilesMatch>

# Sicherheitsheaders
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

#### Nginx
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location ~ \.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/var/run/php/php-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}

# Datenverzeichnis schützen
location ^~ /data/ {
    deny all;
    return 404;
}
```

## 🔒 Sicherheitshinweise

### Production Checklist
- [ ] `API_KEY` auf einen sicheren Wert setzen
- [ ] `ALLOWED_ORIGINS` auf deine Domain beschränken
- [ ] HTTPS aktivieren
- [ ] `/data/` Verzeichnis vor direktem Zugriff schützen
- [ ] Regelmäßige Backups der `data/` Verzeichnisse
- [ ] Logs überwachen (`data/logs/`)

### Rate Limiting
Die API hat eingebaute Rate Limits:
- **30 Saves pro Minute** pro Canvas
- **10 Deletes pro Minute** pro Canvas

Bei Bedarf in `api.php` anpassen.

## 📊 Monitoring

### Logs einsehen
```bash
# Heutige Fehler anzeigen
tail -f data/logs/error_$(date +%Y-%m-%d).log

# Alle Logs durchsuchen
grep "ERROR" data/logs/*.log
```

### Health Check
```bash
curl https://deinedomain.com/api.php?action=health
```

## 🔄 Updates

### Von v3.x auf v4.0
1. Backup erstellen:
   ```bash
   cp -r data data-backup-$(date +%Y%m%d)
   ```
2. Neue Dateien deployen
3. Berechtigungen prüfen
4. Health Check durchführen

## 🐳 Docker (Optional)

```dockerfile
FROM php:8.2-apache

WORKDIR /var/www/html

COPY index.html api.php ./

RUN mkdir -p data/canvases data/revisions data/logs && \
    chown -R www-data:www-data data && \
    chmod -R 755 data

EXPOSE 80
```

## ❓ Troubleshooting

### "Cannot create directory"
- Prüfe Schreibrechte: `ls -la data/`
- Setze korrekte Permissions: `chmod 755 data/`

### CORS Fehler im Browser
- Prüfe `ALLOWED_ORIGINS` in `.env`
- Stelle sicher, dass die Domain exakt übereinstimmt (inkl. http/https)

### Rate Limit exceeded
- Warte 60 Sekunden
- Oder erhöhe die Limits in `api.php` (Zeile ~52)

---

**Version:** 4.0  
**Letzte Aktualisierung:** 2026  
**Author:** Roberto Bonavita
