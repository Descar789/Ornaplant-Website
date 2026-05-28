<?php
declare(strict_types=1);

require_once __DIR__ . '/../../api/db.php';
require_once __DIR__ . '/../../api/slug.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Este script solo se puede ejecutar desde CLI.\n");
    exit(1);
}

$count = 0;
try {
    $pdo = db();
    $stmt = $pdo->query("SELECT id, nombre FROM plantas WHERE slug IS NULL OR slug = '' ORDER BY id");
    $plantas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Iniciando backfill para " . count($plantas) . " plantas...\n";

    $batchSize = 100;
    $updateStmt = $pdo->prepare('UPDATE plantas SET slug = :slug WHERE id = :id');

    $pdo->beginTransaction();

    foreach ($plantas as $planta) {
        $slug = unique_slug($pdo, (string)$planta['nombre'], (string)$planta['id']);

        $updateStmt->execute([
            ':slug' => $slug,
            ':id' => $planta['id'],
        ]);

        $count++;
        echo "ID: {$planta['id']} | Nombre: {$planta['nombre']} -> Slug: {$slug}\n";

        if ($count % $batchSize === 0) {
            $pdo->commit();
            echo "Lote de {$count} procesado y confirmado.\n";
            $pdo->beginTransaction();
        }
    }

    if ($pdo->inTransaction()) {
        $pdo->commit();
    }

    echo "Backfill completado. Se procesaron {$count} plantas.\n";
    exit(0);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    fwrite(STDERR, "Error durante el backfill: " . $e->getMessage() . "\n");
    exit(1);
}
