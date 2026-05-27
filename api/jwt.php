<?php
// api/jwt.php — JWT HS256 sin librerías externas.
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function b64url_encode(string $bytes): string {
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function b64url_decode(string $s): string {
    $pad = strlen($s) % 4;
    if ($pad) $s .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($s, '-_', '+/')) ?: '';
}

function jwt_encode(array $payload, ?string $secret = null, int $ttlSeconds = 28800): string {
    $secret = $secret ?? JWT_SECRET;
    $header  = ['alg' => 'HS256', 'typ' => 'JWT'];
    $now     = time();
    $payload = array_merge(['iat' => $now, 'exp' => $now + $ttlSeconds], $payload);

    $h = b64url_encode(json_encode($header, JSON_UNESCAPED_SLASHES));
    $p = b64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));
    $sig = hash_hmac('sha256', "$h.$p", $secret, true);
    return "$h.$p." . b64url_encode($sig);
}

function jwt_decode(string $token, ?string $secret = null): ?array {
    $secret = $secret ?? JWT_SECRET;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;

    $expected = b64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
    if (!hash_equals($expected, $s)) return null;

    $payload = json_decode(b64url_decode($p), true);
    if (!is_array($payload)) return null;
    if (isset($payload['exp']) && time() >= (int)$payload['exp']) return null;
    return $payload;
}

// Lee Authorization: Bearer xxx desde varios sitios (CGI, FCGI, Apache rewrite)
function get_bearer_token(): ?string {
    $auth = '';
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $hdrs = apache_request_headers();
        foreach ($hdrs as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $auth = $v; break; }
        }
    }
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) return trim($m[1]);
    return null;
}

function require_admin(): array {
    $token = get_bearer_token();
    if (!$token) json_error('Token requerido', 401);
    $payload = jwt_decode($token);
    if (!$payload) json_error('Token inválido o expirado', 401);
    if (($payload['role'] ?? '') !== 'admin') json_error('No autorizado', 403);
    return $payload;
}
