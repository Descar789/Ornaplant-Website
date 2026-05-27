<?php
// api/plantas.php — endpoints públicos de plantas.
//
// GET  /api/plantas.php                       → lista (filtros opcionales)
// GET  /api/plantas.php?id=XXX                → detalle
// PATCH /api/plantas.php?id=XXX&action=incrementar_vistas → +1 vista (público)
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function decode_planta(array $row): array {
    foreach (['etiquetas', 'variaciones', 'imagenes'] as $field) {
        $row[$field] = $row[$field] ? json_decode($row[$field], true) : [];
        if (!is_array($row[$field])) $row[$field] = [];
    }
    // Mapear nombre_cientifico → nombreCientifico (frontend espera camelCase)
    $row['nombreCientifico'] = $row['nombre_cientifico'] ?? '';
    unset($row['nombre_cientifico']);
    $row['vistas'] = (int)($row['vistas'] ?? 0);
    return $row;
}

if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
    if ($id !== '') {
        $stmt = db()->prepare('SELECT * FROM plantas WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) json_error('Planta no encontrada', 404);
        json_response(decode_planta($row));
    }

    // Lista con filtros
    $where  = [];
    $params = [];
    foreach (['categoria', 'disponibilidad', 'sucursal', 'mascotas'] as $f) {
        if (!empty($_GET[$f])) {
            $where[] = "$f = :$f";
            $params[":$f"] = trim((string)$_GET[$f]);
        }
    }
    if (!empty($_GET['buscar'])) {
        $where[] = '(nombre LIKE :q OR nombre_cientifico LIKE :q OR descripcion LIKE :q)';
        $params[':q'] = '%' . trim((string)$_GET['buscar']) . '%';
    }
    $sql = 'SELECT * FROM plantas';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY creado_en DESC';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = array_map('decode_planta', $stmt->fetchAll());
    json_response($rows);
}

if ($method === 'PATCH') {
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
    $action = $_GET['action'] ?? '';
    if ($id === '' || $action !== 'incrementar_vistas') {
        json_error('Acción no válida', 400);
    }
    $stmt = db()->prepare('UPDATE plantas SET vistas = vistas + 1 WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if ($stmt->rowCount() === 0) json_error('Planta no encontrada', 404);
    json_response(['ok' => true]);
}

json_error('Método no permitido', 405);
