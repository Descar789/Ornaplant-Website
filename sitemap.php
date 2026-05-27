<?php
declare(strict_types=1);
require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/db.php';

header('Content-Type: application/xml; charset=utf-8');

$base = rtrim(BASE_URL, '/');
$today = date('Y-m-d');

$paginas = [
    ['loc' => "$base/",                'freq' => 'weekly',  'pri' => '1.0'],
    ['loc' => "$base/nosotros.html",   'freq' => 'monthly', 'pri' => '0.8'],
    ['loc' => "$base/catalogo.html",   'freq' => 'weekly',  'pri' => '0.9'],
    ['loc' => "$base/servicios.html",  'freq' => 'monthly', 'pri' => '0.8'],
    ['loc' => "$base/sucursales.html", 'freq' => 'monthly', 'pri' => '0.7'],
    ['loc' => "$base/horarios.html",   'freq' => 'monthly', 'pri' => '0.6'],
    ['loc' => "$base/contacto.html",   'freq' => 'monthly', 'pri' => '0.7'],
];

$plantas = [];
try {
    $stmt = db()->query('SELECT id, creado_en FROM plantas ORDER BY creado_en DESC');
    $plantas = $stmt->fetchAll();
} catch (Throwable $e) {
    $plantas = [];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($paginas as $p) {
    echo "  <url>\n";
    echo "    <loc>{$p['loc']}</loc>\n";
    echo "    <lastmod>$today</lastmod>\n";
    echo "    <changefreq>{$p['freq']}</changefreq>\n";
    echo "    <priority>{$p['pri']}</priority>\n";
    echo "  </url>\n";
}

foreach ($plantas as $row) {
    $slug = rawurlencode((string)$row['id']);
    $lastmod = $row['creado_en'] ? substr((string)$row['creado_en'], 0, 10) : $today;
    echo "  <url>\n";
    echo "    <loc>$base/planta/$slug</loc>\n";
    echo "    <lastmod>$lastmod</lastmod>\n";
    echo "    <changefreq>weekly</changefreq>\n";
    echo "    <priority>0.7</priority>\n";
    echo "  </url>\n";
}

echo '</urlset>' . "\n";
