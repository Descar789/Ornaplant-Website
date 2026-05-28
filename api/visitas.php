<?php
// api/visitas.php — endpoint para el contador global de visitas (pageviews)
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Autoinicialización tolerante a fallos
try {
    db()->exec("CREATE TABLE IF NOT EXISTS visitas_globales (
        id INT PRIMARY KEY,
        total INT NOT NULL DEFAULT 0
    )");
    db()->exec("INSERT IGNORE INTO visitas_globales (id, total) VALUES (1, 0)");
} catch (\Throwable $e) {
    // Si falla el DDL por falta de permisos o conexión, se registra en log y no rompe
    error_log("[visitas] Error inicializando tabla visitas_globales: " . $e->getMessage());
}

if ($method === 'POST') {
    try {
        db()->exec("UPDATE visitas_globales SET total = total + 1 WHERE id = 1");
        json_response(['ok' => true]);
    } catch (\Throwable $e) {
        error_log("[visitas] Error incrementando visitas: " . $e->getMessage());
        // Devolvemos 200 con estado de falla para evitar alertar al cliente
        json_response(['ok' => false, 'error' => 'Database error']);
    }
}

if ($method === 'GET') {
    try {
        $stmt = db()->query("SELECT total FROM visitas_globales WHERE id = 1");
        $row = $stmt->fetch();
        $total = $row ? (int)$row['total'] : 0;
        json_response(['total' => $total]);
    } catch (\Throwable $e) {
        error_log("[visitas] Error obteniendo visitas: " . $e->getMessage());
        json_response(['total' => 0]);
    }
}

json_error('Método no permitido', 405);
