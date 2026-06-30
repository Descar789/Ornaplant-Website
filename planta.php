<?php
declare(strict_types=1);
require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/db.php';

$slugParam = isset($_GET['slug']) ? trim((string)$_GET['slug']) : '';
$idParam   = isset($_GET['id'])   ? trim((string)$_GET['id'])   : '';

$planta = null;

if ($slugParam !== '') {
    $stmt = db()->prepare('SELECT * FROM plantas WHERE slug = :slug LIMIT 1');
    $stmt->execute([':slug' => $slugParam]);
    $row = $stmt->fetch();
    if ($row) {
        foreach (['etiquetas', 'variaciones', 'imagenes'] as $f) {
            $row[$f] = $row[$f] ? json_decode($row[$f], true) : [];
            if (!is_array($row[$f])) $row[$f] = [];
        }
        $planta = $row;
    }
} elseif ($idParam !== '') {
    $stmt = db()->prepare('SELECT * FROM plantas WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $idParam]);
    $row = $stmt->fetch();
    if ($row) {
        foreach (['etiquetas', 'variaciones', 'imagenes'] as $f) {
            $row[$f] = $row[$f] ? json_decode($row[$f], true) : [];
            if (!is_array($row[$f])) $row[$f] = [];
        }
        $planta = $row;
        // Redirección 301 a la URL canónica del catálogo
        if ($planta && !empty($planta['slug'])) {
            header('Location: ' . BASE_URL . '/catalogo/' . rawurlencode($planta['slug']), true, 301);
            exit;
        }
    }
}

// Calcular ruta base dinámica automática para activos y enlaces portables
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
$baseDir = dirname($scriptName);
$base = ($baseDir === '/' || $baseDir === '\\') ? '' : rtrim(str_replace('\\', '/', $baseDir), '/');

if (!$planta) {
    http_response_code(404);
    $titulo = 'Planta no encontrada — ORNAPLANT';
    $descripcion = 'No encontramos la planta que buscas en ORNAPLANT, Cuautla, Morelos.';
    $canonical = BASE_URL . '/catalogo.html';
    $ogImage = BASE_URL . '/assets/logo-final-ornaplant.png';
    $schema = null;
} else {
    $canonical = BASE_URL . (!empty($planta['slug']) ? '/catalogo/' . rawurlencode($planta['slug']) : '/planta/' . rawurlencode($planta['id']));
    
    // Title canónico: "[Planta] en Cuautla — ORNAPLANT"
    $titulo = htmlspecialchars($planta['nombre'] . ' en Cuautla — ORNAPLANT', ENT_QUOTES, 'UTF-8');
    
    $descRaw = trim(preg_replace('/\s+/', ' ', (string)($planta['descripcion'] ?? '')));
    if (mb_strlen($descRaw) > 160) {
        $descRaw = mb_substr($descRaw, 0, 157) . '...';
    }
    // Meta Description con diferenciadores de autoridad
    $descripcion = htmlspecialchars(
        $descRaw !== '' ? $descRaw : "Venta de {$planta['nombre']} en Cuautla por ORNAPLANT, la primera comercializadora de plantas ornamentales en Morelos desde 1992.", 
        ENT_QUOTES, 
        'UTF-8'
    );

    $imagenes = $planta['imagenes'] ?? [];
    $ogImage = !empty($imagenes[0]) ? (string)$imagenes[0] : BASE_URL . '/assets/logo-final-ornaplant.png';
    $ogImage = htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8');

    // Mapeo dinámico y honesto de "Usos Recomendados"
    $usosMapa = [
        'interior'   => 'Ideal para la decoración de salas, oficinas y espacios cerrados con luz indirecta. Aporta frescura y purifica el aire de tus espacios de forma natural.',
        'exterior'   => 'Excelente para jardines, terrazas, fachadas y áreas de sol directo. Muy resistente a las condiciones climáticas cálidas locales de Morelos.',
        'suculenta'  => 'Perfecta para macetas decorativas de colección, rocallas y arreglos de bajo mantenimiento que requieran poca frecuencia de riego.',
        'ornamental' => 'Muy utilizada en el paisajismo comercial y residencial para aportar texturas visuales, follajes elegantes y contrastes cromáticos vibrantes.',
        'árbol'      => 'Recomendado para sombreado natural, reforestación de áreas amplias, alineación de caminos y proyectos paisajísticos de gran escala.',
        'medicinal'  => 'Valorada tradicionalmente por sus usos culinarios, aromáticos o medicinales. Ideal para huertos caseros y jardineras urbanas.',
    ];
    $categoriaKey = strtolower($planta['categoria'] ?? 'ornamental');
    $usoPlanta = $usosMapa[$categoriaKey] ?? 'Ideal para embellecer y aportar un toque natural, fresco y elegante a cualquier espacio de tu hogar o proyecto paisajístico.';

    // Marcado estructurado Product JSON-LD (Offers sin precio simulado para evitar penalizaciones)
    $availMap = [
        'disponible'  => 'https://schema.org/InStock',
        'de temporada' => 'https://schema.org/PreOrder',
        'agotado'     => 'https://schema.org/OutOfStock',
    ];
    $schema = [
        '@context'    => 'https://schema.org',
        '@type'       => 'Product',
        'name'        => $planta['nombre'],
        'description' => $descRaw,
        'image'       => array_values(array_filter($imagenes)),
        'sku'         => $planta['sku'] ?? $planta['id'],
        'category'    => $planta['categoria'] ?? 'ornamental',
        'brand'       => ['@type' => 'Brand', 'name' => 'ORNAPLANT'],
        'additionalProperty' => [
            ['@type' => 'PropertyValue', 'name' => 'Nombre científico', 'value' => $planta['nombre_cientifico'] ?? ''],
            ['@type' => 'PropertyValue', 'name' => 'Luz',      'value' => $planta['luz'] ?? ''],
            ['@type' => 'PropertyValue', 'name' => 'Riego',    'value' => $planta['riego'] ?? ''],
            ['@type' => 'PropertyValue', 'name' => 'Cuidado',  'value' => $planta['cuidado'] ?? ''],
            ['@type' => 'PropertyValue', 'name' => 'Mascotas', 'value' => $planta['mascotas'] ?? ''],
        ],
        'offers' => [
            '@type'         => 'Offer',
            'url'           => $canonical,
            'priceCurrency' => 'MXN',
            'availability'  => $availMap[$planta['disponibilidad']] ?? 'https://schema.org/InStock',
            'seller'        => [
                '@type' => 'Organization', 
                'name' => 'ORNAPLANT SA DE CV',
                'url' => 'https://ornaplant.com.mx/'
            ]
        ]
    ];
}
?>
<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="<?= $base ?>/assets/favicon-32.png">
  <link rel="apple-touch-icon" href="<?= $base ?>/assets/favicon-32.png">
  <title><?= $titulo ?></title>
  <meta name="description" content="<?= $descripcion ?>">
  <link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:type" content="product">
  <meta property="og:url" content="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:title" content="<?= $titulo ?>">
  <meta property="og:description" content="<?= $descripcion ?>">
  <meta property="og:image" content="<?= $ogImage ?>">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= $titulo ?>">
  <meta name="twitter:description" content="<?= $descripcion ?>">
  <meta name="twitter:image" content="<?= $ogImage ?>">
  <?php if ($schema): ?>
  <script type="application/ld+json"><?= json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
  <?php endif; ?>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block">
  <link rel="stylesheet" href="<?= $base ?>/style.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'g950': '#203b31', 'g800': '#396452', 'g600': '#56816d', 'g100': '#eef4ec',
            'm700': '#b43c6d', 'm900': '#8f2d55', 'm100': '#f8eaf1',
            'e700': '#7b674c', 'e200': '#ddd2bf', 'cream': '#f8f7f1', 'ot': '#223029', 'muted': '#69776d'
          },
          fontFamily: { heading: ['Plus Jakarta Sans','system-ui','sans-serif'], body: ['Manrope','system-ui','sans-serif'] }
        }
      }
    }
  </script>
  <style>
    .tailwind-page { font-family: 'Manrope', system-ui, sans-serif; }
    .gallery-main { aspect-ratio: 4/3; overflow: hidden; border-radius: 16px; background: #eef4ec; }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-thumb { aspect-ratio: 4/3; overflow: hidden; border-radius: 12px; background: #eef4ec; cursor: pointer; }
    .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 300ms ease; }
    .gallery-thumb:hover img { transform: scale(1.04); }
    .gallery-thumb.active { outline: 3px solid #396452; outline-offset: 2px; }
    .care-card { background: white; border: 1px solid rgba(51,92,75,0.16); border-radius: 12px; padding: 1.25rem; }
    .disp-available { background: #dcfce7; color: #166534; }
    .disp-order { background: #fef9c3; color: #854d0e; }
    .disp-sold { background: #fee2e2; color: #991b1b; }
    .pill { display: inline-flex; align-items: center; padding: 0.2rem 0.75rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; text-transform: capitalize; white-space: nowrap; background: #eef4ec; color: #396452; font-family: 'Plus Jakarta Sans', sans-serif; }
    .whatsapp-cta { display: inline-flex; align-items: center; gap: 0.5rem; background: #25D366; color: white; padding: 0.875rem 2rem; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 1rem; text-decoration: none; transition: background 200ms ease, transform 200ms ease; width: 100%; justify-content: center; }
    .whatsapp-cta:hover { background: #128C7E; }
    .whatsapp-cta:active { transform: scale(0.97); }
    .whatsapp-cta svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
    .breadcrumb { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--muted, #69776d); flex-wrap: wrap; }
    .breadcrumb a { color: var(--muted, #69776d); text-decoration: none; transition: color 200ms ease; }
    .breadcrumb a:hover { color: var(--green-800, #396452); }
    .breadcrumb .sep { font-size: 0.75rem; color: var(--muted, #69776d); opacity: 0.5; }
    .not-found { min-height: 60vh; display: flex; align-items: center; justify-content: center; text-align: center; flex-direction: column; gap: 1rem; }
    @media (max-width: 1024px) {
      #plantGridBlock { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
      #galleryCol, #infoCol { grid-column: 1 / -1 !important; }
    }
  </style>
  <script type="module" src="<?= $base ?>/js/analytics.js?v=1"></script>
  <script type="module" src="<?= $base ?>/js/cookie-consent.js?v=1"></script>
</head>
<body class="tailwind-page">

  <header class="site-header" id="header">
    <nav class="navbar container">
      <a class="nav-brand" href="<?= $base ?>/">
        <img src="<?= $base ?>/assets/logo-symbol-web.png" alt="" aria-hidden="true" height="44" class="brand-symbol-img">
        <img src="<?= $base ?>/assets/logo-palabras-web.png" alt="ORNAPLANT" height="28">
      </a>
      <ul class="nav-menu" id="navMenu" role="list">
        <li><a href="<?= $base ?>/">Inicio</a></li>
        <li><a href="<?= $base ?>/nosotros.html">Sobre Nosotros</a></li>
        <li><a href="<?= $base ?>/catalogo.html">Catálogo</a></li>
        <li><a href="<?= $base ?>/sucursales.html">Sucursales</a></li>
        <li><a href="<?= $base ?>/horarios.html">Horarios</a></li>
        <li><a href="<?= $base ?>/contacto.html" class="nav-cta">Contacto</a></li>
      </ul>
      <button class="nav-toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navMenu">
        <span class="material-symbols-outlined" id="navIcon">menu</span>
      </button>
    </nav>
  </header>

  <main id="plantDetail" style="background:var(--cream);" class="tailwind-page">
    <?php if (!$planta): ?>
      <div class="container not-found" style="padding:5rem 0;">
        <span class="material-symbols-outlined" style="font-size:4rem;color:var(--earth-200);">search_off</span>
        <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:2rem;font-weight:700;color:#223029;">Planta no encontrada</h2>
        <p style="color:var(--muted);margin-bottom:1.5rem;">No encontramos la planta que buscas.</p>
        <a href="<?= $base ?>/catalogo.html" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:0.5rem;"><span class="material-symbols-outlined">arrow_back</span>Volver al catálogo</a>
      </div>
    <?php else: ?>
      <?php
      $rawImgs = $planta['imagenes'] ?? [];
      $mainImage = !empty($rawImgs[0]) ? $rawImgs[0] : 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&auto=format&fit=crop';
      $skuLine = $planta['sku'] ? "\n- SKU: " . $planta['sku'] : '';
      $waMsg = rawurlencode("Hola ORNAPLANT, me interesa la siguiente planta:\n- Nombre: {$planta['nombre']}{$skuLine}\n¿Está disponible?");
      
      $dispCls = ['disponible' => 'disp-available', 'de temporada' => 'disp-order', 'agotado' => 'disp-sold'];
      $dispLbl = ['disponible' => 'Disponible', 'de temporada' => 'De temporada', 'agotado' => 'Agotado'];
      $luzIcon = ['sol directo' => 'wb_sunny', 'luz indirecta' => 'light_mode', 'media sombra' => 'partly_cloudy_day', 'sombra' => 'cloud'];
      $cuidadoIcon = ['fácil' => 'sentiment_satisfied', 'intermedio' => 'sentiment_neutral', 'difícil' => 'sentiment_dissatisfied'];
      ?>

      <div class="container" style="padding-top:2.5rem;padding-bottom:5rem;">
        <!-- RUTA DE NAVEGACIÓN -->
        <nav class="breadcrumb" aria-label="Ruta de navegación" style="margin-bottom:1.5rem;">
          <a href="<?= $base ?>/catalogo.html">Catálogo</a>
          <span class="sep" aria-hidden="true">/</span>
          <a href="<?= $base ?>/catalogo.html?categoria=<?= urlencode(strtolower($planta['categoria'])) ?>"><?= htmlspecialchars(ucfirst($planta['categoria'] ?? ''), ENT_QUOTES, 'UTF-8') ?></a>
          <span class="sep" aria-hidden="true">/</span>
          <span aria-current="page"><?= htmlspecialchars($planta['nombre'], ENT_QUOTES, 'UTF-8') ?></span>
        </nav>

        <!-- LAYOUT DE 12 COLUMNAS -->
        <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2.5rem;align-items:start;" id="plantGridBlock">
          
          <!-- GALERÍA (COL 1-8) -->
          <div style="grid-column:span 8;" class="flex flex-col gap-2" id="galleryCol">
            <div class="gallery-main" id="mainImgWrap">
              <img id="mainImg" src="<?= htmlspecialchars($mainImage, ENT_QUOTES, 'UTF-8') ?>" alt="Planta ornamental <?= htmlspecialchars($planta['nombre'], ENT_QUOTES, 'UTF-8') ?> - Vivero ORNAPLANT Cuautla" width="800" height="600" loading="eager">
            </div>
            
            <?php if (count($rawImgs) > 1): ?>
              <!-- MINIATURAS -->
              <div style="display:flex;gap:0.5rem;margin-top:0.5rem;flex-wrap:wrap;">
                <?php foreach ($rawImgs as $idx => $img): ?>
                  <button type="button" class="gallery-thumb <?= $idx === 0 ? 'active' : '' ?>" data-src="<?= htmlspecialchars($img, ENT_QUOTES, 'UTF-8') ?>" style="width:72px;height:54px;padding:0;border:none;">
                    <img src="<?= htmlspecialchars($img, ENT_QUOTES, 'UTF-8') ?>" alt="Miniatura de <?= htmlspecialchars($planta['nombre'], ENT_QUOTES, 'UTF-8') ?>" width="72" height="54" loading="lazy">
                  </button>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>

            <p style="display:flex;align-items:center;gap:0.375rem;font-size:0.75rem;color:#69776d;font-style:italic;margin-top:0.25rem;">
              <span class="material-symbols-outlined" style="font-size:0.95rem;color:#9ec4b0;">info</span>
              La imagen es de referencia y puede variar del producto físico en el vivero.
            </p>
          </div>

          <!-- DETALLE (COL 9-12) -->
          <div style="grid-column:span 4;" class="flex flex-col gap-5" id="infoCol">
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;">
              <span style="padding:0.25rem 0.75rem;border-radius:100px;font-size:0.7rem;font-weight:700;letter-spacing:0.04em;font-family:'Plus Jakarta Sans',sans-serif;" class="<?= $dispCls[$planta['disponibilidad']] ?? 'disp-available' ?>"><?= $dispLbl[$planta['disponibilidad']] ?? $planta['disponibilidad'] ?></span>
              <?php if (!empty($planta['etiquetas'])): ?>
                <?php foreach ($planta['etiquetas'] as $tag): ?>
                  <span class="pill"><?= htmlspecialchars((string)$tag, ENT_QUOTES, 'UTF-8') ?></span>
                <?php endforeach; ?>
              <?php endif; ?>
            </div>

            <div>
              <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(1.75rem,3.5vw,2.25rem);font-weight:800;line-height:1.1;color:#223029;margin-bottom:0.375rem;"><?= htmlspecialchars($planta['nombre'], ENT_QUOTES, 'UTF-8') ?></h1>
              <p style="font-style:italic;color:#69776d;font-size:0.9375rem;"><?= htmlspecialchars($planta['nombre_cientifico'] ?? '', ENT_QUOTES, 'UTF-8') ?></p>
              <?php if (!empty($planta['sku'])): ?>
                <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.75rem;font-weight:700;letter-spacing:0.07em;color:#9ec4b0;margin-top:0.25rem;">SKU: <?= htmlspecialchars($planta['sku'], ENT_QUOTES, 'UTF-8') ?></p>
              <?php endif; ?>
            </div>

            <!-- GRID 2x2 CARE CARDS -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;" role="list" aria-label="Especificaciones de cuidado">
              <div class="care-card" role="listitem">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;">
                  <span class="material-symbols-outlined" style="font-size:1.25rem;color:#396452;"><?= $luzIcon[strtolower($planta['luz'])] ?? 'wb_sunny' ?></span>
                  <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#69776d;font-family:'Plus Jakarta Sans',sans-serif;">Luz</span>
                </div>
                <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.9rem;font-weight:600;color:#223029;text-transform:capitalize;"><?= htmlspecialchars($planta['luz'] ?? 'luz indirecta', ENT_QUOTES, 'UTF-8') ?></p>
              </div>
              
              <div class="care-card" role="listitem">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;">
                  <span class="material-symbols-outlined" style="font-size:1.25rem;color:#396452;">water_drop</span>
                  <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#69776d;font-family:'Plus Jakarta Sans',sans-serif;">Riego</span>
                </div>
                <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.9rem;font-weight:600;color:#223029;text-transform:capitalize;"><?= htmlspecialchars($planta['riego'] ?? 'medio', ENT_QUOTES, 'UTF-8') ?></p>
              </div>

              <div class="care-card" role="listitem">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;">
                  <span class="material-symbols-outlined" style="font-size:1.25rem;color:#396452;"><?= $cuidadoIcon[strtolower($planta['cuidado'])] ?? 'eco' ?></span>
                  <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#69776d;font-family:'Plus Jakarta Sans',sans-serif;">Cuidado</span>
                </div>
                <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.9rem;font-weight:600;color:#223029;text-transform:capitalize;"><?= htmlspecialchars($planta['cuidado'] ?? 'fácil', ENT_QUOTES, 'UTF-8') ?></p>
              </div>

              <div class="care-card" role="listitem">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;">
                  <span class="material-symbols-outlined" style="font-size:1.25rem;color:<?= strtolower($planta['mascotas']) === 'tóxica' ? '#b43c6d' : '#396452' ?>;">pets</span>
                  <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#69776d;font-family:'Plus Jakarta Sans',sans-serif;">Mascotas</span>
                </div>
                <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.9rem;font-weight:600;color:<?= strtolower($planta['mascotas']) === 'tóxica' ? '#b43c6d' : '#166534' ?>;text-transform:capitalize;"><?= strtolower($planta['mascotas']) === 'tóxica' ? '⚠ Tóxica' : 'No tóxica' ?></p>
              </div>
            </div>

            <?php if (!empty($planta['variaciones'])): ?>
              <!-- TAMAÑOS -->
              <div>
                <p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#69776d;margin-bottom:0.625rem;">Tamaños disponibles</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                  <?php foreach ($planta['variaciones'] as $var): ?>
                    <span style="padding:0.375rem 0.875rem;border:1.5px solid rgba(51,92,75,0.16);border-radius:6px;font-size:0.875rem;font-weight:600;color:#396452;background:white;font-family:'Plus Jakarta Sans',sans-serif;text-transform:capitalize;"><?= htmlspecialchars((string)$var, ENT_QUOTES, 'UTF-8') ?></span>
                  <?php endforeach; ?>
                </div>
              </div>
            <?php endif; ?>

            <!-- CTA WHATSAPP -->
            <a href="https://wa.me/527351024413?text=<?= $waMsg ?>" class="whatsapp-cta" target="_blank" rel="noopener noreferrer" aria-label="Consultar disponibilidad de <?= htmlspecialchars($planta['nombre'], ENT_QUOTES, 'UTF-8') ?> por WhatsApp">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.07 21.47a.75.75 0 00.918.918l4.356-1.371A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25a8.245 8.245 0 01-4.21-1.16l-.3-.178-3.108.978.99-3.042-.197-.31A8.25 8.25 0 1120.25 12a8.26 8.26 0 01-8.251 8.25z"/>
              </svg>
              Consultar disponibilidad
            </a>

            <p style="font-size:0.8125rem;color:#69776d;text-align:center;">Respuesta en horario de atención · Sin precio en línea</p>
          </div>
        </div>

        <!-- SECCIONES ACORDEÓN SSR (DESCRIPCIÓN Y USOS RECOMENDADOS) -->
        <div style="margin-top:3rem;padding-top:2.5rem;border-top:1px solid rgba(51,92,75,0.16);">
          <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.25rem;font-weight:700;color:#223029;margin-bottom:0.75rem;">Descripción</h2>
          <p style="color:#69776d;font-size:1rem;line-height:1.75;max-width:72ch;margin-bottom:2rem;"><?= htmlspecialchars((string)$planta['descripcion'], ENT_QUOTES, 'UTF-8') ?></p>

          <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.25rem;font-weight:700;color:#223029;margin-bottom:0.75rem;">Usos Recomendados en Paisajismo</h2>
          <p style="color:#69776d;font-size:1rem;line-height:1.75;max-width:72ch;margin-bottom:2rem;"><?= htmlspecialchars($usoPlanta, ENT_QUOTES, 'UTF-8') ?></p>
          
          <div style="background:var(--green-100);padding:1.5rem;border-radius:12px;margin-top:1.5rem;border:1px solid rgba(51,92,75,0.16);">
            <h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.05rem;font-weight:700;color:#223029;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.5rem;"><span class="material-symbols-outlined" style="color:#396452;">storefront</span>Disponible en nuestras sucursales en Cuautla</h3>
            <p style="color:#69776d;font-size:0.925rem;margin-bottom:0.75rem;">Esta variedad de planta ornamental se comercializa directamente en nuestras dos sucursales en Cuautla, Morelos. Atendemos pedidos a menudeo, medio mayoreo y mayoreo.</p>
            <a href="<?= $base ?>/sucursales.html" style="color:#396452;font-weight:700;font-size:0.925rem;text-decoration:underline;display:inline-flex;align-items:center;gap:0.25rem;">Ver ubicación de sucursales<span class="material-symbols-outlined" style="font-size:0.9rem;">arrow_forward</span></a>
          </div>
        </div>

        <div style="margin-top:2.5rem;">
          <a href="<?= $base ?>/catalogo.html" class="btn btn-ghost btn-sm" style="display:inline-flex;align-items:center;gap:0.375rem;">
            <span class="material-symbols-outlined" style="font-size:1rem;">arrow_back</span>
            Volver al catálogo
          </a>
        </div>
      </div>
    <?php endif; ?>
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="<?= $base ?>/assets/logo-horizontal-web.png" alt="ORNAPLANT">
          <p>Comercializadora de plantas ornamentales en Morelos. Desde 1992.</p>
        </div>
        <div class="footer-col">
          <h4>Navegación</h4>
          <ul>
            <li><a href="<?= $base ?>/">Inicio</a></li>
            <li><a href="<?= $base ?>/nosotros.html">Sobre Nosotros</a></li>
            <li><a href="<?= $base ?>/catalogo.html">Catálogo</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Visítanos</h4>
          <ul>
            <li><a href="<?= $base ?>/sucursales.html">Sucursales</a></li>
            <li><a href="<?= $base ?>/horarios.html">Horarios</a></li>
            <li><a href="<?= $base ?>/contacto.html">Contacto</a></li>
            <li><a href="mailto:informesornaplant@hotmail.com">Enviar email</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 ORNAPLANT SA DE CV · Cuautla, Morelos</span>
        <span>Plantas ornamentales desde 1992 · <a href="<?= $base ?>/admin.html" style="opacity: 0.7; text-decoration: none;">Acceso Admin</a></span>
      </div>
    </div>
  </footer>

  <button class="back-to-top" id="backToTop" aria-label="Volver arriba">
    <span class="material-symbols-outlined">keyboard_arrow_up</span>
  </button>

  <script>
    // MEJORA PROGRESIVA (INTERACTIVIDAD DE GALERÍA)
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Galería: click en miniatura cambia la imagen principal
      document.querySelectorAll('.gallery-thumb').forEach(t => {
        t.addEventListener('click', () => {
          const mainImg = document.getElementById('mainImg');
          if (mainImg) {
            mainImg.src = t.dataset.src;
          }
          document.querySelectorAll('.gallery-thumb').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
        });
      });
    });
  </script>
  <?php if ($planta && !empty($planta['id'])): ?>
  <script>
    window.__ORNAPLANT_PLANT_ID__ = <?= json_encode((string)$planta['id'], JSON_UNESCAPED_SLASHES) ?>;
  </script>
  <?php endif; ?>
  <script src="<?= $base ?>/script.js"></script>
</body>
</html>
