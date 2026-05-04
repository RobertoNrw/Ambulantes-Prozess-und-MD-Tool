<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Write-Key');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

define('DATA_DIR', __DIR__ . '/data');
define('CANVAS_DIR', DATA_DIR . '/canvases');
define('REVISION_DIR', DATA_DIR . '/revisions');
define('MAX_BODY_BYTES', 5 * 1024 * 1024);
define('MAX_REVISIONS_PER_CANVAS', 20);
define('ENABLE_DELETE', true);
define('REQUIRE_WRITE_KEY', false);
define('WRITE_KEY', 'bitte-spaeter-aendern');

function respond($payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function ensure_dirs(): void {
    foreach ([DATA_DIR, CANVAS_DIR, REVISION_DIR] as $dir) {
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            respond(['ok' => false, 'error' => 'Verzeichnis konnte nicht erstellt werden: ' . basename($dir)], 500);
        }
    }
}
function get_action(): string { return strtolower(trim((string)($_GET['action'] ?? 'health'))); }
function get_canvas_id(): string {
    $id = trim((string)($_GET['id'] ?? 'default'));
    if (!preg_match('/^[A-Za-z0-9_-]{1,80}$/', $id)) respond(['ok' => false, 'error' => 'Ungültige Canvas-ID'], 400);
    return $id;
}
function check_write_key(): void {
    if (!REQUIRE_WRITE_KEY) return;
    $key = $_SERVER['HTTP_X_WRITE_KEY'] ?? '';
    if (!hash_equals(WRITE_KEY, $key)) respond(['ok' => false, 'error' => 'Nicht autorisiert'], 401);
}
function canvas_file(string $id): string { return CANVAS_DIR . '/' . $id . '.json'; }
function revision_file(string $id): string { return REVISION_DIR . '/' . $id . '__' . date('Ymd_His') . '__' . bin2hex(random_bytes(3)) . '.json'; }
function read_json_file(string $file): ?array {
    if (!is_file($file)) return null;
    $raw = file_get_contents($file);
    if ($raw === false) respond(['ok' => false, 'error' => 'Datei konnte nicht gelesen werden'], 500);
    $json = json_decode($raw, true);
    if (!is_array($json)) respond(['ok' => false, 'error' => 'Gespeicherte Datei ist beschädigt'], 500);
    return $json;
}
function write_json_file(string $file, array $data): void {
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) respond(['ok' => false, 'error' => 'JSON-Kodierung fehlgeschlagen'], 500);
    if (file_put_contents($file, $json, LOCK_EX) === false) respond(['ok' => false, 'error' => 'Datei konnte nicht geschrieben werden'], 500);
}
function cleanup_revisions(string $id): void {
    $files = glob(REVISION_DIR . '/' . $id . '__*.json') ?: [];
    usort($files, static fn($a,$b) => filemtime($b) <=> filemtime($a));
    foreach (array_slice($files, MAX_REVISIONS_PER_CANVAS) as $file) @unlink($file);
}
function body_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false) respond(['ok' => false, 'error' => 'Request-Body konnte nicht gelesen werden'], 400);
    if (strlen($raw) > MAX_BODY_BYTES) respond(['ok' => false, 'error' => 'Request-Body zu groß'], 413);
    $json = json_decode($raw, true);
    if (!is_array($json)) respond(['ok' => false, 'error' => 'Ungültiges JSON'], 400);
    return $json;
}
function canvas_summary(array $doc, string $id, string $file): array {
    $data = $doc['data'] ?? ['nodes' => [], 'edges' => []];
    return [
        'id' => $id,
        'updatedAt' => $doc['updatedAt'] ?? null,
        'createdAt' => $doc['createdAt'] ?? null,
        'nodeCount' => is_array($data['nodes'] ?? null) ? count($data['nodes']) : 0,
        'edgeCount' => is_array($data['edges'] ?? null) ? count($data['edges']) : 0,
        'bytes' => is_file($file) ? filesize($file) : 0,
    ];
}

ensure_dirs();
$action = get_action();
if ($action === 'health') respond(['ok' => true, 'service' => 'canvas-api', 'php' => PHP_VERSION, 'time' => date('c'), 'writeProtected' => REQUIRE_WRITE_KEY]);
if ($action === 'list') {
    $items = [];
    foreach (glob(CANVAS_DIR . '/*.json') ?: [] as $file) {
        $id = basename($file, '.json');
        $doc = read_json_file($file);
        if ($doc) $items[] = canvas_summary($doc, $id, $file);
    }
    usort($items, static fn($a,$b) => strcmp((string)($b['updatedAt'] ?? ''), (string)($a['updatedAt'] ?? '')));
    respond(['ok' => true, 'items' => $items]);
}
$id = get_canvas_id();
$file = canvas_file($id);
if ($action === 'load') {
    if (!is_file($file)) respond(['ok' => true, 'id' => $id, 'exists' => false, 'data' => ['nodes' => [], 'edges' => []]]);
    $doc = read_json_file($file);
    respond(['ok' => true, 'id' => $id, 'exists' => true, 'updatedAt' => $doc['updatedAt'] ?? null, 'createdAt' => $doc['createdAt'] ?? null, 'data' => $doc['data'] ?? ['nodes' => [], 'edges' => []]]);
}
if ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'Nur POST erlaubt'], 405);
    check_write_key();
    $body = body_json();
    $data = $body['data'] ?? null;
    if (!is_array($data)) respond(['ok' => false, 'error' => 'Feld data fehlt'], 400);
    if (!isset($data['nodes']) || !is_array($data['nodes'])) $data['nodes'] = [];
    if (!isset($data['edges']) || !is_array($data['edges'])) $data['edges'] = [];
    $existing = is_file($file) ? read_json_file($file) : null;
    $now = date('c');
    $doc = ['id' => $id, 'createdAt' => $existing['createdAt'] ?? $now, 'updatedAt' => $now, 'version' => (int)($existing['version'] ?? 0) + 1, 'data' => $data];
    if ($existing) { write_json_file(revision_file($id), $existing); cleanup_revisions($id); }
    write_json_file($file, $doc);
    respond(['ok' => true, 'id' => $id, 'updatedAt' => $doc['updatedAt'], 'version' => $doc['version'], 'nodeCount' => count($data['nodes']), 'edgeCount' => count($data['edges'])]);
}
if ($action === 'delete') {
    if (!ENABLE_DELETE) respond(['ok' => false, 'error' => 'Delete deaktiviert'], 403);
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'Nur POST erlaubt'], 405);
    check_write_key();
    if (!is_file($file)) respond(['ok' => true, 'deleted' => false, 'id' => $id]);
    $existing = read_json_file($file);
    if ($existing) write_json_file(revision_file($id), $existing);
    @unlink($file);
    cleanup_revisions($id);
    respond(['ok' => true, 'deleted' => true, 'id' => $id]);
}
if ($action === 'revisions') {
    $items = [];
    foreach (glob(REVISION_DIR . '/' . $id . '__*.json') ?: [] as $rev) {
        $items[] = ['file' => basename($rev), 'updatedAt' => date('c', filemtime($rev)), 'bytes' => filesize($rev)];
    }
    usort($items, static fn($a,$b) => strcmp($b['updatedAt'], $a['updatedAt']));
    respond(['ok' => true, 'id' => $id, 'items' => $items]);
}
if ($action === 'restore') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'Nur POST erlaubt'], 405);
    check_write_key();
    $body = body_json();
    $revFile = $body['revisionFile'] ?? '';
    if (!preg_match('/^[A-Za-z0-9_-]+__[0-9]{8}_[0-9]{6}__[0-9a-f]{3}\.json$/', $revFile)) respond(['ok' => false, 'error' => 'Ungültige Revisionsdatei'], 400);
    $revPath = REVISION_DIR . '/' . $revFile;
    if (!is_file($revPath)) respond(['ok' => false, 'error' => 'Revision nicht gefunden'], 404);
    $revDoc = read_json_file($revPath);
    $now = date('c');
    $doc = ['id' => $id, 'createdAt' => $revDoc['createdAt'] ?? $now, 'updatedAt' => $now, 'version' => (int)($existing['version'] ?? 0) + 1, 'data' => $revDoc['data'] ?? ['nodes' => [], 'edges' => []]];
    write_json_file($file, $doc);
    respond(['ok' => true, 'id' => $id, 'restoredFrom' => $revFile, 'updatedAt' => $doc['updatedAt']]);
}
if ($action === 'rename') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['ok' => false, 'error' => 'Nur POST erlaubt'], 405);
    check_write_key();
    $body = body_json();
    $newName = trim($body['name'] ?? '');
    if ($newName === '') respond(['ok' => false, 'error' => 'Name darf nicht leer sein'], 400);
    if (strlen($newName) > 200) respond(['ok' => false, 'error' => 'Name zu lang'], 400);
    $metaFile = CANVAS_DIR . '/' . $id . '.meta.json';
    $meta = is_file($metaFile) ? read_json_file($metaFile) : ['name' => 'Unbenanntes Canvas'];
    $meta['name'] = $newName;
    $meta['updatedAt'] = date('c');
    write_json_file($metaFile, $meta);
    respond(['ok' => true, 'id' => $id, 'name' => $newName]);
}
respond(['ok' => false, 'error' => 'Unbekannte action'], 404);
