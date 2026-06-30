<?php
// api/admin/usuarios.php — gestión de perfiles admin (solo dueño).
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';

$caller = require_owner();
$callerId = (int)($caller['sub'] ?? 0);

const VALID_ROLES = ['owner', 'editor'];

function field_error(string $msg, string $field, int $code = 400): void {
    json_response(['error' => $msg, 'field' => $field], $code);
}

function count_active_owners(): int {
    $stmt = db()->query("SELECT COUNT(*) FROM admins WHERE role = 'owner' AND activo = 1");
    return (int)$stmt->fetchColumn();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $stmt = db()->query('SELECT id, nombre, email, role, activo, creado_en FROM admins ORDER BY creado_en ASC');
    $rows = array_map(function ($r) {
        $r['id'] = (int)$r['id'];
        $r['activo'] = (int)$r['activo'];
        return $r;
    }, $stmt->fetchAll());
    json_response($rows);
}

if ($method === 'POST') {
    $body = json_input();
    $nombre   = trim((string)($body['nombre'] ?? ''));
    $email    = trim((string)($body['email'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $role     = (string)($body['role'] ?? 'editor');

    if ($nombre === '')                                 field_error('El nombre es requerido', 'nombre');
    if ($email === '')                                  field_error('El correo es requerido', 'email');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))     field_error('Correo inválido', 'email');
    if (strlen($password) < 8)                          field_error('La contraseña debe tener al menos 8 caracteres', 'password');
    if (!in_array($role, VALID_ROLES, true))            field_error('Rol inválido', 'role');

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    try {
        $stmt = db()->prepare(
            'INSERT INTO admins (email, role, nombre, password_hash, activo)
             VALUES (:email, :role, :nombre, :hash, 1)'
        );
        $stmt->execute([
            ':email'  => $email,
            ':role'   => $role,
            ':nombre' => $nombre,
            ':hash'   => $hash,
        ]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? 0) === 1062) {
            field_error('Ese correo ya está registrado', 'email', 409);
        }
        throw $e;
    }

    json_response([
        'id'     => (int)db()->lastInsertId(),
        'nombre' => $nombre,
        'email'  => $email,
        'role'   => $role,
        'activo' => 1,
    ], 201);
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) json_error('ID requerido', 400);

    if ($id === $callerId) json_error('No puedes eliminar tu propia cuenta', 400);

    $stmt = db()->prepare('SELECT role, activo FROM admins WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $target = $stmt->fetch();
    if (!$target) json_error('Perfil no encontrado', 404);

    // No permitir borrar al último dueño activo.
    if ($target['role'] === 'owner' && (int)$target['activo'] === 1 && count_active_owners() <= 1) {
        json_error('No puedes eliminar al último dueño', 400);
    }

    $del = db()->prepare('DELETE FROM admins WHERE id = :id');
    $del->execute([':id' => $id]);
    json_response(['ok' => true]);
}

json_error('Método no permitido', 405);
