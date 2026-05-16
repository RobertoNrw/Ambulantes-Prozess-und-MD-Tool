<?php
/**
 * Infinite Canvas API v4.2
 * Verbesserte Fehlerbehandlung, Security Header und robusteres Rate Limiting
 */

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(0);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$isLocalHost = in_array($host, ['localhost', '127.0.0.1'], true) || str_ends_with($host, '.local');
$isProduction = !$isLocalHost;

function env_value(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    $envFile = __DIR__ . '/.env';
    if (is_file($envFile) && is_readable($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = explode('=', $line, 2);
            if (trim($k) === $key) {
                return trim($v, " \t\n\r\0\x0B\"");
            }
        }
    }

    return $default;
}

function respond(array $payload, int $status = 200): void {
    global $action;

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

$dataDirFromEnv = env_value('DATA_DIR');
define('DATA_DIR', $dataDirFromEnv ? rtrim($dataDirFromEnv, '/\\') : __DIR__ . '/data');
define('CANVAS_DIR', DATA_DIR . '/canvases');
define('REVISION_DIR', DATA_DIR . '/revisions');
define('LOG_DIR', DATA_DIR . '/logs');
define('RATE_LIMIT_FILE', DATA_DIR . '/.ratelimit');
define('MAX_BODY_BYTES', 5 * 1024 * 1024);
define('MAX_REVISIONS_PER_CANVAS', 20);
define('ENABLE_DELETE', true);

$apiKey = env_value('API_KEY');
define('REQUIRE_WRITE_KEY', !empty($apiKey));
define('WRITE_KEY', $apiKey ?: '');

if ($isProduction && !REQUIRE_WRITE_KEY) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Production configuration error: API_KEY is required',
        'suggestion' => 'Setze API_KEY in der Server-Umgebung oder in einer nicht versionierten .env-Datei.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$allowedOriginsRaw = env_value('ALLOWED_ORIGINS', '');
$allowed_origins = [];
if ($allowedOriginsRaw !== '') {
    $allowed_origins = array_values(array_filter(array_map('trim', explode(',', $allowedOriginsRaw))));
}
if (empty($allowed_origins)) {
    $allowed_origins = ['https://board.bonavita.com.de', 'http://localhost', 'http://127.0.0.1', 'http://localhost:8080'];
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
} elseif ($origin === '' && !$isProduction) {
    header('Access-Control-Allow-Origin: *');
} else {
    header('Access-Control-Allow-Origin: null');
}

$scriptSrc = "'self' https://unpkg.com https://cdn.jsdelivr.net https://cdn.jsdelivr.net/npm https://cdnjs.cloudflare.com";
$connectSrc = "'self' https://board.bonavita.com.de wss: https://*.peerjs.com https://*.googleapis.com https://cdn.jsdelivr.net https://unpkg.com";
$imgSrc = "'self' data: blob: https:";
$styleSrc = "'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com";
$fontSrc = "'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com";
$csp = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src {$scriptSrc}; connect-src {$connectSrc}; img-src {$imgSrc}; style-src {$styleSrc}; font-src {$fontSrc}; media-src 'self' blob: data:; worker-src 'self' blob:; form-action 'self'; upgrade-insecure-requests";

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Write-Key');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: {$csp}");

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$debug_info = [
    'php_version' => phpversion(),
    'cwd' => getcwd(),
    'script_path' => __FILE__,
    'data_dir' => DATA_DIR,
    'canvas_dir' => CANVAS_DIR,
    'allowed_origins' => $allowed_origins,
    'request_origin' => $origin,
    'api_key_set' => REQUIRE_WRITE_KEY,
    'env_file_exists' => file_exists(__DIR__ . '/.env'),
    'is_production' => $isProduction,
];

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
        $context ? ' | Context: ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : ''
    );
    @file_put_contents($log_file, $entry, FILE_APPEND | LOCK_EX);
}

try {
    foreach ([DATA_DIR, CANVAS_DIR, REVISION_DIR, LOG_DIR] as $dir) {
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new Exception('Kann Verzeichnis nicht erstellen: ' . $dir);
        }
    }

    if (!is_writable(CANVAS_DIR)) {
        throw new Exception('Keine Schreibrechte für CANVAS_DIR: ' . CANVAS_DIR . '. Bitte chmod 775 oder chown www-data ausführen.');
    }
    if (!is_writable(LOG_DIR)) {
        error_log('Warning: LOG_DIR nicht beschreibbar: ' . LOG_DIR);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'debug' => $debug_info,
        'suggestion' => 'Stelle sicher dass der Webserver (www-data) Schreibrechte auf dem data/ Ordner hat. Führe aus: chmod -R 775 data/ && chown -R www-data:www-data data/'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function rate_limit_storage_read(): array {
    $fh = @fopen(RATE_LIMIT_FILE, 'c+');
    if ($fh === false) {
        return [null, []];
    }

    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        return [null, []];
    }

    $raw = stream_get_contents($fh);
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        $data = [];
    }

    return [$fh, $data];
}

function rate_limit_storage_write($fh, array $data): void {
    if (!is_resource($fh)) {
        return;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

function check_rate_limit(string $id, string $action): void {
    [$fh, $limits] = rate_limit_storage_read();
    $now = time();
    $window = 60;
    $key = $action . ':' . $id . ':' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

    foreach ($limits as $k => $entry) {
        if (!is_array($entry) || (($entry['t'] ?? 0) < ($now - $window))) {
            unset($limits[$k]);
        }
    }

    if (!isset($limits[$key])) {
        $limits[$key] = ['count' => 0, 't' => $now];
    }

    $limits[$key]['count']++;
    $limits[$key]['t'] = $now;

    $limitMap = [
        'save' => 30,
        'delete' => 10,
        'restore' => 10,
    ];
    $limit = $limitMap[$action] ?? 20;

    rate_limit_storage_write($fh, $limits);

    if ($limits[$key]['count'] > $limit) {
        respond(['ok' => false, 'error' => 'Rate limit exceeded: ' . $limit . '/' . strtoupper($action) . ' per minute'], 429);
    }
}

function revision_file(string $id): string {
    $hash = bin2hex(random_bytes(6));
    return REVISION_DIR . '/' . $id . '__' . date('Ymd_His') . '__' . $hash . '.json';
}

function sanitize_canvas_id(string $id): string {
    $id = trim($id);
    if (!preg_match('/^[A-Za-z0-9_\-]{1,80}$/', $id)) {
        respond(['ok' => false, 'error' => 'Invalid canvas ID'], 400);
    }
    return $id;
}

function validate_canvas_data(array $data): bool {
    if (!isset($data['nodes']) || !is_array($data['nodes'])) {
        return false;
    }
    if (!isset($data['edges']) || !is_array($data['edges'])) {
        return false;
    }

    if (count($data['nodes']) > 5000) {
        respond(['ok' => false, 'error' => 'Too many nodes (max 5000)'], 400);
    }
    if (count($data['edges']) > 10000) {
        respond(['ok' => false, 'error' => 'Too many connections (max 10000)'], 400);
    }

    $allowedTypes = ['text', 'sticky', 'checklist', 'group', 'table', 'link', 'diamond', 'ellipse', 'hexagon', 'image'];

    foreach ($data['nodes'] as $n) {
        if (!is_array($n) || !isset($n['id'], $n['type'], $n['x'], $n['y'])) {
            respond(['ok' => false, 'error' => 'Invalid node structure'], 400);
        }
        if (!in_array($n['type'], $allowedTypes, true)) {
            respond(['ok' => false, 'error' => 'Invalid node type: ' . $n['type']], 400);
        }
        if (!is_numeric($n['x']) || !is_numeric($n['y'])) {
            respond(['ok' => false, 'error' => 'Node coordinates must be numeric'], 400);
        }
    }

    return true;
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
    if (!REQUIRE_WRITE_KEY) {
        return;
    }
    $key = $_SERVER['HTTP_X_WRITE_KEY'] ?? '';
    if (!hash_equals(WRITE_KEY, $key)) {
        respond(['ok' => false, 'error' => 'Unauthorized: Invalid API key'], 401);
    }
}

function canvas_file(string $id): string {
    return CANVAS_DIR . '/' . $id . '.json';
}

function meta_file(string $id): string {
    return CANVAS_DIR . '/' . $id . '.meta.json';
}

function read_json_file(string $file): ?array {
    if (!is_file($file)) {
        return null;
    }
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
    $pattern = REVISION_DIR . '/' . $id . '__*.json';
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
    $data = $doc['data'] ?? ['nodes' => [], 'edges' => []];
    $meta = read_json_file(meta_file($id)) ?? [];

    return [
        'id' => $id,
        'name' => $meta['name'] ?? $id,
        'updatedAt' => $doc['updatedAt'] ?? null,
        'createdAt' => $doc['createdAt'] ?? null,
        'nodeCount' => is_array($data['nodes'] ?? null) ? count($data['nodes']) : 0,
        'connCount' => is_array($data['edges'] ?? null) ? count($data['edges']) : 0,
        'bytes' => is_file($file) ? filesize($file) : 0,
    ];
}

ensure_dirs();
$action = get_action();

if ($action === 'health') {
    respond([
        'ok' => true,
        'service' => 'canvas-api',
        'version' => '4.2',
        'php' => PHP_VERSION,
        'time' => date('c'),
        'writeProtected' => REQUIRE_WRITE_KEY ? 'yes' : 'no (development only)',
        'maxBodySize' => (MAX_BODY_BYTES / 1024 / 1024) . ' MB'
    ]);
}

if ($action === 'list') {
    $items = [];
    foreach (glob(CANVAS_DIR . '/*.json') ?: [] as $file) {
        if (str_ends_with($file, '.meta.json')) {
            continue;
        }
        $id = basename($file, '.json');
        $doc = read_json_file($file);
        if ($doc) {
            $items[] = canvas_summary($doc, $id, $file);
        }
    }
    usort($items, static fn($a, $b) => strcmp((string)($b['updatedAt'] ?? ''), (string)($a['updatedAt'] ?? '')));
    respond(['ok' => true, 'count' => count($items), 'items' => $items]);
}

$id = get_canvas_id();
$file = canvas_file($id);

if ($action === 'load') {
    $doc = read_json_file($file);
    $meta = read_json_file(meta_file($id)) ?? [];
    respond([
        'ok' => true,
        'id' => $id,
        'name' => $meta['name'] ?? $id,
        'exists' => (bool)$doc,
        'updatedAt' => $doc['updatedAt'] ?? null,
        'createdAt' => $doc['createdAt'] ?? null,
        'version' => $doc['version'] ?? 0,
        'data' => $doc['data'] ?? ['nodes' => [], 'edges' => []]
    ]);
}

if ($action === 'save') {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }

    check_write_key();
    check_rate_limit($id, 'save');

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
        'connCount' => count($data['edges'])
    ]);
}

if ($action === 'delete') {
    if (!ENABLE_DELETE) {
        respond(['ok' => false, 'error' => 'Delete disabled'], 403);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }

    check_write_key();
    check_rate_limit($id, 'delete');

    if (!is_file($file)) {
        respond(['ok' => true, 'deleted' => false, 'id' => $id]);
    }

    $existing = read_json_file($file);
    if ($existing) {
        write_json_file(revision_file($id), $existing);
    }
    @unlink($file);
    @unlink(meta_file($id));
    cleanup_revisions($id);

    respond(['ok' => true, 'deleted' => true, 'id' => $id]);
}

if ($action === 'revisions') {
    $pattern = REVISION_DIR . '/' . $id . '__*.json';
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
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }

    check_write_key();
    check_rate_limit($id, 'restore');

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
        'data' => $revDoc['data'] ?? ['nodes' => [], 'edges' => []]
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
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        respond(['ok' => false, 'error' => 'POST required'], 405);
    }

    check_write_key();
    check_rate_limit($id, 'rename');

    $body = body_json();
    $newName = trim((string)($body['name'] ?? ''));

    if ($newName === '') {
        respond(['ok' => false, 'error' => 'Name cannot be empty'], 400);
    }
    if (mb_strlen($newName) > 200) {
        respond(['ok' => false, 'error' => 'Name too long (max 200 chars)'], 400);
    }

    $meta = is_file(meta_file($id)) ? (read_json_file(meta_file($id)) ?? []) : [];
    $meta['name'] = $newName;
    $meta['updatedAt'] = date('c');
    write_json_file(meta_file($id), $meta);

    respond(['ok' => true, 'id' => $id, 'name' => $newName]);
}

respond(['ok' => false, 'error' => 'Unknown action: ' . $action], 404);
