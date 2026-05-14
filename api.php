<?php
/**
 * Infinite Canvas API v4.1
 * Verbesserte Fehlerbehandlung und Debugging
 */

ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// === SICHERHEIT: CORS nur für erlaubte Domains ===
$allowed_origins = [];
if (getenv('ALLOWED_ORIGINS')) {
    $allowed_origins = array_map('trim', explode(',', getenv('ALLOWED_ORIGINS')));
} else {
    // Fallback: .env Datei lesen falls getenv nicht funktioniert
    $env_file = __DIR__ . '/.env';
    if (file_exists($env_file)) {
        $env_content = file_get_contents($env_file);
        if (preg_match('/ALLOWED_ORIGINS=(.*)/', $env_content, $matches)) {
            $allowed_origins = array_map('trim', explode(',', trim($matches[1])));
        }
    }
    if (empty($allowed_origins)) {
        $allowed_origins = ['https://board.bonavita.com.de', 'http://localhost', 'http://127.0.0.1', 'http://localhost:8080'];
    }
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    if (empty($origin) || in_array($origin, ['http://localhost', 'http://127.0.0.1', 'http://localhost:8080'], true)) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        header('Access-Control-Allow-Origin: ');
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Write-Key');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(204); 
    exit; 
}

// CONFIG: Sollte aus .env kommen
define('DATA_DIR', __DIR__ . '/data');
define('CANVAS_DIR', DATA_DIR . '/canvases');
define('REVISION_DIR', DATA_DIR . '/revisions');
define('LOG_DIR', DATA_DIR . '/logs');
define('MAX_BODY_BYTES', 5 * 1024 * 1024);
define('MAX_REVISIONS_PER_CANVAS', 20);
define('ENABLE_DELETE', true);
define('REQUIRE_WRITE_KEY', getenv('API_KEY') ? true : false);
define('WRITE_KEY', getenv('API_KEY') ?: 'dev-key-change-in-production');

// Debug Info für Error Messages
$debug_info = [
    'php_version' => phpversion(),
    'cwd' => getcwd(),
    'script_path' => __FILE__,
    'data_dir' => DATA_DIR,
    'canvas_dir' => CANVAS_DIR,
    'allowed_origins' => $allowed_origins,
    'request_origin' => $origin,
    'api_key_set' => !empty(getenv('API_KEY')),
    'env_file_exists' => file_exists(__DIR__ . '/.env')
];

// === LOGGING: Zentrale Fehlerprotokollierung ===
function log_error(string $message, array $context = []): void {
    if (!is_dir(LOG_DIR)) {
        @mkdir(LOG_DIR, 0755, true);
    }
    $log_file = LOG_DIR . '/error_' . date('Y-m-d') . '.log';
    $entry = sprintf(
        "[%s] %s %s - %s%s\n",
        date('c'),
        $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        $_SERVER['REQUEST_URI'] ?? 'unknown',
        $message,
        $context ? ' | Context: ' . json_encode($context) : ''
    );
    @file_put_contents($log_file, $entry, FILE_APPEND | LOCK_EX);
}

// === VERZEICHNISSE ERSTELLEN UND PRÜFEN ===
try {
    if (!is_dir(DATA_DIR)) {
        if (!@mkdir(DATA_DIR, 0755, true)) {
            throw new Exception("Kann DATA_DIR nicht erstellen: " . DATA_DIR);
        }
    }
    if (!is_dir(CANVAS_DIR)) {
        if (!@mkdir(CANVAS_DIR, 0775, true)) {
            throw new Exception("Kann CANVAS_DIR nicht erstellen: " . CANVAS_DIR);
        }
    }
    if (!is_dir(REVISION_DIR)) {
        if (!@mkdir(REVISION_DIR, 0775, true)) {
            throw new Exception("Kann REVISION_DIR nicht erstellen: " . REVISION_DIR);
        }
    }
    if (!is_dir(LOG_DIR)) {
        if (!@mkdir(LOG_DIR, 0775, true)) {
            throw new Exception("Kann LOG_DIR nicht erstellen: " . LOG_DIR);
        }
    }
    
    // Schreibrechte prüfen
    if (!is_writable(CANVAS_DIR)) {
        throw new Exception("Keine Schreibrechte für CANVAS_DIR: " . CANVAS_DIR . ". Bitte chmod 775 oder chown www-data ausführen.");
    }
    if (!is_writable(LOG_DIR)) {
        error_log("Warning: LOG_DIR nicht beschreibbar: " . LOG_DIR);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'debug' => $debug_info,
        'suggestion' => 'Stelle sicher dass der Webserver (www-data) Schreibrechte auf dem data/ Ordner hat. Führe aus: chmod -R 775 data/ && chown -R www-data:www-data data/'
    ]);
    exit;
}

// === VERBESSERUNGEN ===

/**
 * KRITISCH: Rate Limiting (verhindert Spam/DoS)
 */
function check_rate_limit(string $id, string $action): void {
    $store_file = DATA_DIR . '/.ratelimit';
    
    // Einfache File-basierte Rate Limit (für Shared Hosting)
    $limits = @json_decode(@file_get_contents($store_file), true) ?: [];
    $key = "{$action}:{$id}";
    $now = time();
    
    // Cleanup alte Einträge
    $limits = array_filter($limits, fn($v) => $v['t'] > $now - 60);
    
    if (!isset($limits[$key])) {
        $limits[$key] = ['count' => 0, 't' => $now];
    }
    
    $limits[$key]['count']++;
    $limits[$key]['t'] = $now;
    
    // Limits: 30 saves pro Minute, 10 deletes
    $limit = ($action === 'delete') ? 10 : 30;
    
    if ($limits[$key]['count'] > $limit) {
        http_response_code(429);
        respond(['ok' => false, 'error' => 'Rate limit exceeded: ' . $limit . '/' . strtoupper($action) . ' per minute']);
    }
    
    @file_put_contents($store_file, json_encode($limits, JSON_PRETTY_PRINT), LOCK_EX);
}

/**
 * SICHERHEIT: Bessere Random für Revisions
 */
function revision_file(string $id): string {
    // 6 bytes (48 bits) statt 3 = 281 Billionen möglich Werte
    // Bei 1000/Tag: ~770 Jahre bis Kollision (Birthday Paradox)
    $hash = bin2hex(random_bytes(6));
    return REVISION_DIR . '/' . $id . '__' . date('Ymd_His') . '__' . $hash . '.json';
}

/**
 * SICHERHEIT: Input Sanitization
 */
function sanitize_canvas_id(string $id): string {
    $id = trim($id);
    // Alphanumeric, dash, underscore, max 80 chars
    if (!preg_match('/^[A-Za-z0-9_\-]{1,80}$/', $id)) {
        respond(['ok' => false, 'error' => 'Invalid canvas ID'], 400);
    }
    return $id;
}

/**
 * SICHERHEIT: Daten-Validierung vor Speicherung
 */
function validate_canvas_data(array $data): bool {
    // Sicherstellen dass nodes/conns Arrays sind
    if (!isset($data['nodes']) || !is_array($data['nodes'])) {
        return false;
    }
    if (!isset($data['edges']) || !is_array($data['edges'])) {
        return false;
    }
    
    // Größen-Check (verhindert Spam)
    if (count($data['nodes']) > 5000) {
        respond(['ok' => false, 'error' => 'Too many nodes (max 5000)'], 400);
    }
    if (count($data['conns']) > 10000) {
        respond(['ok' => false, 'error' => 'Too many connections (max 10000)'], 400);
    }
    
    // Node-Struktur validieren
    foreach ($data['nodes'] as $n) {
        if (!isset($n['id'], $n['type'], $n['x'], $n['y'])) {
            respond(['ok' => false, 'error' => 'Invalid node structure'], 400);
        }
        // Nur erlaubte Types
        if (!in_array($n['type'], ['text', 'sticky', 'checklist', 'group', 'table', 'link', 'diamond', 'ellipse', 'hexagon', 'image'])) {
            respond(['ok' => false, 'error' => 'Invalid node type: ' . $n['type']], 400);
        }
        // Koordinaten sind Nummern
        if (!is_numeric($n['x']) || !is_numeric($n['y'])) {
            respond(['ok' => false, 'error' => 'Node coordinates must be numeric'], 400);
        }
    }
    
    return true;
}

/**
 * ALLE URSPRÜNGLICHEN FUNKTIONEN BLEIBEN GLEICH...
 */

function respond($payload, int $status = 200): void {
    // Logging für Fehler
    if ($status >= 400) {
        log_error('API Error', [
            'status' => $status,
            'error' => $payload['error'] ?? 'unknown',
            'action' => $_GET['action'] ?? 'unknown',
            'canvas_id' => $_GET['id'] ?? 'unknown'
        ]);
    }
    
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ensure_dirs(): void {
    foreach ([DATA_DIR, CANVAS_DIR, REVISION_DIR, LOG_DIR] as $dir) {
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            log_error('Cannot create directory: ' . basename($dir));
            respond(['ok' => false, 'error' => 'Cannot create directory: ' . basename($dir)], 500);
        }
    }
}

function get_action(): string { 
    return strtolower(trim((string)($_GET['action'] ?? 'health'))); 
}

function get_canvas_id(): string {
    $id = trim((string)($_GET['id'] ?? 'default'));
    return sanitize_canvas_id($id);
}

function check_write_key(): void {
    if (!REQUIRE_WRITE_KEY) return;
    $key = $_SERVER['HTTP_X_WRITE_KEY'] ?? '';
    if (!hash_equals(WRITE_KEY, $key)) {
        respond(['ok' => false, 'error' => 'Unauthorized: Invalid API key'], 401);
    }
}

function canvas_file(string $id): string { 
    return CANVAS_DIR . '/' . $id . '.json'; 
}

function read_json_file(string $file): ?array {
    if (!is_file($file)) return null;
    $raw = @file_get_contents($file);
    if ($raw === false) {
        respond(['ok' => false, 'error' => 'Cannot read file'], 500);
    }
    $json = @json_decode($raw, true);
    if (!is_array($json)) {
        respond(['ok' => false, 'error' => 'Corrupted data'], 500);
    }
    return $json;
}

function write_json_file(string $file, array $data): void {
    $json = @json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        respond(['ok' => false, 'error' => 'JSON encoding failed'], 500);
    }
    if (@file_put_contents($file, $json, LOCK_EX) === false) {
        respond(['ok' => false, 'error' => 'Cannot write file'], 500);
    }
}

function cleanup_revisions(string $id): void {
    $pattern = REVISION_DIR . '/' . preg_quote($id) . '__*.json';
    $files = glob($pattern) ?: [];
    if (count($files) > MAX_REVISIONS_PER_CANVAS) {
        usort($files, static fn($a, $b) => filemtime($b) <=> filemtime($a));
        foreach (array_slice($files, MAX_REVISIONS_PER_CANVAS) as $file) {
            @unlink($file);
        }
    }
}

function body_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        respond(['ok' => false, 'error' => 'Cannot read request body'], 400);
    }
    if (strlen($raw) > MAX_BODY_BYTES) {
        respond(['ok' => false, 'error' => 'Request body too large (max ' . (MAX_BODY_BYTES / 1024 / 1024) . 'MB)'], 413);
    }
    $json = @json_decode($raw, true);
    if (!is_array($json)) {
        respond(['ok' => false, 'error' => 'Invalid JSON'], 400);
    }
    return $json;
}

function canvas_summary(array $doc, string $id, string $file): array {
    $data = $doc['data'] ?? ['nodes' => [], 'conns' => []];
    return [
        'id' => $id,
        'updatedAt' => $doc['updatedAt'] ?? null,
        'createdAt' => $doc['createdAt'] ?? null,
        'nodeCount' => is_array($data['nodes'] ?? null) ? count($data['nodes']) : 0,
        'connCount' => is_array($data['conns'] ?? null) ? count($data['conns']) : 0,
        'bytes' => is_file($file) ? filesize($file) : 0,
    ];
}

ensure_dirs();
$action = get_action();

// === ENDPOINTS (mit Verbesserungen) ===

if ($action === 'health') {
    respond([
        'ok' => true, 
        'service' => 'canvas-api', 
        'version' => '4.1',
        'php' => PHP_VERSION, 
        'time' => date('c'), 
        'writeProtected' => REQUIRE_WRITE_KEY ? 'yes' : 'no (ENTWICKLUNG)',
        'maxBodySize' => MAX_BODY_BYTES / 1024 / 1024 . ' MB'
    ]);
}

if ($action === 'list') {
    $items = [];
    foreach (glob(CANVAS_DIR . '/*.json') ?: [] as $file) {
        $id = basename($file, '.json');
        $doc = read_json_file($file);
        if ($doc) $items[] = canvas_summary($doc, $id, $file);
    }
    usort($items, static fn($a, $b) => strcmp((string)($b['updatedAt'] ?? ''), (string)($a['updatedAt'] ?? '')));
    respond(['ok' => true, 'count' => count($items), 'items' => $items]);
}

$id = get_canvas_id();
$file = canvas_file($id);

if ($action === 'load') {
    $doc = read_json_file($file);
    respond([
        'ok' => true, 
        'id' => $id, 
        'exists' => (bool) $doc,
        'updatedAt' => $doc['updatedAt'] ?? null, 
        'createdAt' => $doc['createdAt'] ?? null, 
        'version' => $doc['version'] ?? 0,
        'data' => $doc['data'] ?? ['nodes' => [], 'conns' => []]
    ]);
}

if ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }
    
    check_write_key();
    check_rate_limit($id, 'save');  // ← HINZUGEFÜGT
    
    $body = body_json();
    $data = $body['data'] ?? null;
    
    if (!is_array($data)) {
        respond(['ok' => false, 'error' => 'Missing field: data'], 400);
    }
    
    if (!validate_canvas_data($data)) {
        respond(['ok' => false, 'error' => 'Invalid canvas data structure'], 400);
    }

    $existing = is_file($file) ? read_json_file($file) : null;
    $now = date('c');
    $doc = [
        'id' => $id, 
        'createdAt' => $existing['createdAt'] ?? $now, 
        'updatedAt' => $now, 
        'version' => (int)($existing['version'] ?? 0) + 1, 
        'data' => $data
    ];

    if ($existing) { 
        write_json_file(revision_file($id), $existing); 
        cleanup_revisions($id); 
    }
    write_json_file($file, $doc);

    respond([
        'ok' => true, 
        'id' => $id, 
        'updatedAt' => $doc['updatedAt'], 
        'version' => $doc['version'], 
        'nodeCount' => count($data['nodes']), 
        'connCount' => count($data['conns'])
    ]);
}

if ($action === 'delete') {
    if (!ENABLE_DELETE) {
        respond(['ok' => false, 'error' => 'Delete disabled'], 403);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }
    
    check_write_key();
    check_rate_limit($id, 'delete');  // ← HINZUGEFÜGT
    
    if (!is_file($file)) {
        respond(['ok' => true, 'deleted' => false, 'id' => $id]);
    }
    
    $existing = read_json_file($file);
    if ($existing) {
        write_json_file(revision_file($id), $existing);
    }
    @unlink($file);
    cleanup_revisions($id);
    
    respond(['ok' => true, 'deleted' => true, 'id' => $id]);
}

if ($action === 'revisions') {
    $pattern = REVISION_DIR . '/' . preg_quote($id) . '__*.json';
    $items = [];
    foreach (glob($pattern) ?: [] as $rev) {
        $items[] = [
            'file' => basename($rev), 
            'updatedAt' => date('c', filemtime($rev)), 
            'bytes' => filesize($rev)
        ];
    }
    usort($items, static fn($a, $b) => strcmp($b['updatedAt'], $a['updatedAt']));
    respond(['ok' => true, 'id' => $id, 'count' => count($items), 'items' => array_slice($items, 0, MAX_REVISIONS_PER_CANVAS)]);
}

if ($action === 'restore') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }
    
    check_write_key();
    check_rate_limit($id, 'restore');  // ← HINZUGEFÜGT
    
    $body = body_json();
    $revFile = $body['revisionFile'] ?? '';
    
    if (!preg_match('/^[A-Za-z0-9_\-]+__[0-9]{8}_[0-9]{6}__[0-9a-f]{12}\.json$/', $revFile)) {
        respond(['ok' => false, 'error' => 'Invalid revision file'], 400);
    }
    
    $revPath = REVISION_DIR . '/' . $revFile;
    if (!is_file($revPath)) {
        respond(['ok' => false, 'error' => 'Revision not found'], 404);
    }
    
    $revDoc = read_json_file($revPath);
    $now = date('c');

    $existing = is_file($file) ? read_json_file($file) : null;
    if ($existing) {
        write_json_file(revision_file($id), $existing);
    }
    
    $doc = [
        'id' => $id, 
        'createdAt' => $revDoc['createdAt'] ?? $now, 
        'updatedAt' => $now, 
        'version' => (int)($existing['version'] ?? 0) + 1, 
        'data' => $revDoc['data'] ?? ['nodes' => [], 'conns' => []]
    ];

    write_json_file($file, $doc);
    
    respond([
        'ok' => true, 
        'id' => $id, 
        'restoredFrom' => $revFile, 
        'updatedAt' => $doc['updatedAt'],
        'version' => $doc['version']
    ]);
}

if ($action === 'rename') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }
    
    check_write_key();
    
    $body = body_json();
    $newName = trim($body['name'] ?? '');
    
    if ($newName === '') {
        respond(['ok' => false, 'error' => 'Name cannot be empty'], 400);
    }
    if (strlen($newName) > 200) {
        respond(['ok' => false, 'error' => 'Name too long (max 200 chars)'], 400);
    }
    
    $metaFile = CANVAS_DIR . '/' . $id . '.meta.json';
    $meta = is_file($metaFile) ? read_json_file($metaFile) : [];
    $meta['name'] = $newName;
    $meta['updatedAt'] = date('c');
    write_json_file($metaFile, $meta);
    
    respond(['ok' => true, 'id' => $id, 'name' => $newName]);
}

respond(['ok' => false, 'error' => 'Unknown action: ' . $action], 404);
