<?php
// api/admin/upload.php — sube imagen a /uploads/plantas/{sku}.{ext}.
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../jwt.php';

require_admin();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_error('Método no permitido', 405);
}

if (empty($_FILES['imagen']) || ($_FILES['imagen']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_error('Archivo "imagen" no recibido', 400);
}

$sku = strtoupper(trim((string)($_POST['sku'] ?? '')));
if ($sku === '' || !preg_match('/^[A-Z0-9_-]{1,100}$/', $sku)) {
    json_error('SKU inválido', 400);
}

$file = $_FILES['imagen'];
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) json_error('Imagen mayor a 5MB', 400);

// Validar mime real (no confiar en $_FILES['type'])
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($file['tmp_name']) ?: '';
$mimeToExt = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];
if (!isset($mimeToExt[$mime])) {
    json_error('Tipo no permitido (solo jpg, png, webp)', 400);
}
$ext = $mimeToExt[$mime];

if (!is_dir(UPLOAD_DIR)) {
    if (!mkdir(UPLOAD_DIR, 0755, true) && !is_dir(UPLOAD_DIR)) {
        json_error('No se pudo crear directorio de uploads', 500);
    }
}

// Borrar variantes previas del mismo SKU (jpg/png/webp) — opción A: una sola imagen.
foreach ($mimeToExt as $oldExt) {
    $old = UPLOAD_DIR . "/$sku.$oldExt";
    if (is_file($old)) @unlink($old);
}

$dest = UPLOAD_DIR . "/$sku.$ext";
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    json_error('No se pudo guardar el archivo', 500);
}
@chmod($dest, 0644);

$ruta = UPLOAD_PATH . "/$sku.$ext";  // ruta relativa
$url  = BASE_URL . '/' . $ruta;       // URL absoluta

json_response([
    'ok'    => true,
    'ruta'  => $ruta,
    'url'   => $url,
    'sku'   => $sku,
    'bytes' => $file['size'],
]);
