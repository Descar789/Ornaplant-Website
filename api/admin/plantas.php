<?php
// api/admin/plantas.php — CRUD admin (requiere JWT).
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';
require_once __DIR__ . '/../slug.php';

require_admin();

function handle_duplicate(PDOException $e): void {
    if (($e->errorInfo[1] ?? 0) !== 1062) return;
    $msg = $e->getMessage();
    if (str_contains($msg, 'uk_sku') || str_contains($msg, "'sku'")) {
        json_response(['error' => 'SKU duplicado', 'field' => 'sku'], 409);
    }
    json_error('ID duplicado', 409);
}

const ENUMS = [
    'categoria'      => ['interior', 'exterior', 'suculenta', 'ornamental', 'árbol', 'medicinal'],
    'luz'            => ['sol directo', 'luz indirecta', 'media sombra', 'sombra'],
    'riego'          => ['bajo', 'medio', 'alto'],
    'cuidado'        => ['fácil', 'intermedio', 'difícil'],
    'disponibilidad' => ['disponible', 'de temporada', 'agotado'],
    'sucursal'       => ['ambas', 'matriz', 'embarques'],
    'revision_estado' => ['no revisada', 'correcta', 'incorrecta'],
    'mascotas'       => ['no tóxica', 'tóxica'],
];

function decode_planta(array $row): array {
    foreach (['etiquetas', 'variaciones', 'imagenes', 'imagenes_historial'] as $f) {
        $row[$f] = $row[$f] ? json_decode($row[$f], true) : [];
        if (!is_array($row[$f])) $row[$f] = [];
    }
    $row['nombreCientifico'] = $row['nombre_cientifico'] ?? '';
    unset($row['nombre_cientifico']);
    $row['vistas'] = (int)($row['vistas'] ?? 0);
    return $row;
}

function validate_enum(string $field, $value): void {
    if (!isset(ENUMS[$field])) return;
    if (!in_array($value, ENUMS[$field], true)) {
        json_error("Valor inválido para '$field': $value", 400);
    }
}

function build_payload(array $body, bool $isUpdate = false): array {
    // Frontend manda nombreCientifico (camelCase). Convertir a snake.
    if (isset($body['nombreCientifico'])) {
        $body['nombre_cientifico'] = $body['nombreCientifico'];
        unset($body['nombreCientifico']);
    }

    $allowed = [
        'nombre', 'nombre_cientifico', 'categoria', 'descripcion',
        'luz', 'riego', 'cuidado', 'disponibilidad', 'sucursal', 'mascotas',
        'sku', 'etiquetas', 'variaciones', 'imagenes', 'revision_estado',
    ];
    $out = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) $out[$f] = $body[$f];
    }

    if (!$isUpdate) {
        if (empty($out['nombre'])) json_error('Campo "nombre" requerido', 400);
    }

    foreach (['categoria', 'luz', 'riego', 'cuidado', 'disponibilidad', 'sucursal', 'mascotas', 'revision_estado'] as $f) {
        if (isset($out[$f])) validate_enum($f, $out[$f]);
    }

    foreach (['etiquetas', 'variaciones', 'imagenes'] as $f) {
        if (isset($out[$f])) {
            if (!is_array($out[$f])) json_error("Campo '$f' debe ser array", 400);
            $out[$f] = json_encode(array_values($out[$f]), JSON_UNESCAPED_UNICODE);
        }
    }

    return $out;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

if ($method === 'GET') {
    if ($id !== '') {
        $stmt = db()->prepare('SELECT * FROM plantas WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) json_error('Planta no encontrada', 404);
        json_response(decode_planta($row));
    }
    $stmt = db()->query('SELECT * FROM plantas ORDER BY creado_en DESC');
    json_response(array_map('decode_planta', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = json_input();
    $newId = trim((string)($body['id'] ?? ''));
    if ($newId === '') {
        $newId = !empty($body['sku']) ? strtoupper(trim($body['sku']))
               : slugify((string)($body['nombre'] ?? ''));
    }
    if ($newId === '') json_error('No se pudo generar ID', 400);
    if (strlen($newId) > 100) json_error('ID demasiado largo', 400);

    $payload = build_payload($body, false);
    $payload['id'] = $newId;
    $payload['slug'] = unique_slug(db(), $payload['nombre'], $newId);

    $cols = array_keys($payload);
    $place = array_map(fn($c) => ":$c", $cols);
    $sql = 'INSERT INTO plantas (' . implode(',', $cols) . ') VALUES (' . implode(',', $place) . ')';
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute(array_combine($place, array_values($payload)));
    } catch (PDOException $e) {
        handle_duplicate($e);
        throw $e;
    }
    json_response(['id' => $newId, 'ok' => true], 201);
}

if ($method === 'PUT') {
    if ($id === '') json_error('ID requerido', 400);
    $body = json_input();
    $payload = build_payload($body, true);
    if (!$payload) json_error('Sin campos para actualizar', 400);

    // Conservar fotos reemplazadas: nunca se pierden, quedan en imagenes_historial.
    if (isset($payload['imagenes'])) {
        $stmtImgs = db()->prepare('SELECT imagenes, imagenes_historial FROM plantas WHERE id = :id LIMIT 1');
        $stmtImgs->execute([':id' => $id]);
        $imgRow = $stmtImgs->fetch();
        if ($imgRow) {
            $oldImgs = $imgRow['imagenes'] ? json_decode($imgRow['imagenes'], true) : [];
            $newImgs = json_decode($payload['imagenes'], true) ?: [];
            $historial = $imgRow['imagenes_historial'] ? json_decode($imgRow['imagenes_historial'], true) : [];
            if (!is_array($oldImgs)) $oldImgs = [];
            if (!is_array($newImgs)) $newImgs = [];
            if (!is_array($historial)) $historial = [];
            $dropped = array_diff($oldImgs, $newImgs);
            foreach ($dropped as $url) {
                if (!in_array($url, $historial, true)) $historial[] = $url;
            }
            if ($dropped) $payload['imagenes_historial'] = json_encode(array_values($historial), JSON_UNESCAPED_UNICODE);
        }
    }

    // Obtener el slug actual en la DB
    $stmtCheck = db()->prepare('SELECT slug FROM plantas WHERE id = :id LIMIT 1');
    $stmtCheck->execute([':id' => $id]);
    $currentSlug = $stmtCheck->fetchColumn();

    // Solo autogeneramos el slug en PUT si el slug actual en la DB está vacío o es NULL
    if (empty($currentSlug)) {
        $nombreParaSlug = $payload['nombre'] ?? '';
        if ($nombreParaSlug === '') {
            $stmtName = db()->prepare('SELECT nombre FROM plantas WHERE id = :id LIMIT 1');
            $stmtName->execute([':id' => $id]);
            $nombreParaSlug = $stmtName->fetchColumn() ?: '';
        }
        if ($nombreParaSlug !== '') {
            $payload['slug'] = unique_slug(db(), $nombreParaSlug, $id);
        }
    }

    $sets = [];
    $params = [':id' => $id];
    foreach ($payload as $col => $val) {
        $sets[] = "$col = :$col";
        $params[":$col"] = $val;
    }
    $sql = 'UPDATE plantas SET ' . implode(',', $sets) . ' WHERE id = :id';
    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
    } catch (PDOException $e) {
        handle_duplicate($e);
        throw $e;
    }
    json_response(['ok' => true, 'actualizado' => $stmt->rowCount()]);
}

if ($method === 'DELETE') {
    if ($id === '') json_error('ID requerido', 400);
    $stmt = db()->prepare('DELETE FROM plantas WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if ($stmt->rowCount() === 0) json_error('Planta no encontrada', 404);
    json_response(['ok' => true]);
}

if ($method === 'PATCH') {
    $action = $_GET['action'] ?? '';
    if ($action !== 'reset_revision') json_error('Accion no valida', 400);
    require_owner();
    db()->exec("UPDATE plantas SET revision_estado = 'no revisada'");
    json_response(['ok' => true]);
}

json_error('Método no permitido', 405);
