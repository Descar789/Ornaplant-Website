<?php
// api/admin/auth.php — login admin → JWT.
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    json_error('Método no permitido', 405);
}

$body = json_input();
$email = trim((string)($body['email'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_error('Email y contraseña requeridos', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Email inválido', 400);
}

$stmt = db()->prepare('SELECT id, email, password_hash, role, nombre, activo FROM admins WHERE email = :email LIMIT 1');
$stmt->execute([':email' => $email]);
$admin = $stmt->fetch();

// Tiempo constante: si no existe el admin, hacer hash dummy para evitar timing attack
if (!$admin) {
    password_verify($password, '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali');
    json_error('Credenciales inválidas', 401);
}

if (!password_verify($password, $admin['password_hash'])) {
    json_error('Credenciales inválidas', 401);
}

if (isset($admin['activo']) && (int)$admin['activo'] === 0) {
    json_error('Cuenta desactivada', 403);
}

$role = $admin['role'] ?? 'owner';

$token = jwt_encode([
    'sub'   => (int)$admin['id'],
    'email' => $admin['email'],
    'role'  => $role,
], null, 8 * 3600);

json_response([
    'token' => $token,
    'email' => $admin['email'],
    'role'  => $role,
    'nombre' => $admin['nombre'] ?? '',
    'expira_en' => 8 * 3600,
]);
