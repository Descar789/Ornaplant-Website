<?php
// api/config.php — config global, .env loader, helpers JSON+CORS.
declare(strict_types=1);

// ── .env loader (parser simple, sin Composer) ─────────────────────
function load_env(string $path): void {
    if (!is_file($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        // strip quotes if any
        if (strlen($v) >= 2 && ($v[0] === '"' || $v[0] === "'") && $v[strlen($v)-1] === $v[0]) {
            $v = substr($v, 1, -1);
        }
        if (getenv($k) === false) {
            putenv("$k=$v");
            $_ENV[$k] = $v;
        }
    }
}

load_env(__DIR__ . '/.env');

// ── Constantes ────────────────────────────────────────────────────
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'ornaplant');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

define('JWT_SECRET', getenv('JWT_SECRET') ?: 'cambiar-esto-en-produccion');
define('BASE_URL',   rtrim(getenv('BASE_URL') ?: 'http://localhost/ornaplant', '/'));

define('UPLOAD_DIR',  __DIR__ . '/../uploads/plantas');
define('UPLOAD_PATH', 'uploads/plantas'); // ruta pública relativa

// ── Headers globales ──────────────────────────────────────────────
function send_cors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Max-Age: 86400');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ── JSON helpers ──────────────────────────────────────────────────
function json_response($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $msg, int $code = 400): void {
    json_response(['error' => $msg], $code);
}

function json_input(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) json_error('JSON inválido', 400);
    return $decoded;
}

// ── Bootstrap del request ─────────────────────────────────────────
send_cors();

// Error handler global → JSON
set_exception_handler(function (\Throwable $e) {
    error_log('[api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    json_error('Error interno del servidor', 500);
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new \ErrorException($message, 0, $severity, $file, $line);
});
