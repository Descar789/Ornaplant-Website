<?php
declare(strict_types=1);
require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/db.php';

$plantasIniciales = [];
try {
    $pdo = db();
    $stmt = $pdo->query('SELECT id, slug, nombre, nombre_cientifico, categoria, luz, riego, cuidado, disponibilidad, etiquetas, imagenes, sku FROM plantas ORDER BY creado_en DESC LIMIT 24');
    $plantasIniciales = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    error_log('[catalogo] ' . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="es-MX">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" href="assets/favicon-32.png">
  <link rel="apple-touch-icon" href="assets/favicon-32.png">
  <title>Catálogo de Plantas Ornamentales en Cuautla | ORNAPLANT</title>
  <meta name="description" content="Explora el catálogo de plantas ornamentales en Cuautla de ORNAPLANT, la primera comercializadora de plantas ornamentales en Morelos desde 1992.">
  <link rel="canonical" href="https://ornaplant.com.mx/catalogo.html">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://ornaplant.com.mx/catalogo.html">
  <meta property="og:title" content="Catálogo de Plantas Ornamentales en Cuautla | ORNAPLANT">
  <meta property="og:description" content="Explora el catálogo de plantas ornamentales en Cuautla de ORNAPLANT, la primera comercializadora de plantas ornamentales en Morelos desde 1992.">
  <meta property="og:image" content="https://ornaplant.com.mx/assets/logo-final-ornaplant.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Catálogo de Plantas Ornamentales en Cuautla | ORNAPLANT">
  <meta name="twitter:description" content="Explora el catálogo de plantas ornamentales en Cuautla de ORNAPLANT, la primera comercializadora de plantas ornamentales en Morelos desde 1992.">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://ornaplant.com.mx/catalogo.html#webpage",
        "url": "https://ornaplant.com.mx/catalogo.html",
        "name": "Catálogo de Plantas Ornamentales en Cuautla | ORNAPLANT",
        "isPartOf": { "@id": "https://ornaplant.com.mx/#website" },
        "about": { "@id": "https://ornaplant.com.mx/#organization" },
        "inLanguage": "es-MX"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://ornaplant.com.mx/" },
          { "@type": "ListItem", "position": 2, "name": "Catálogo", "item": "https://ornaplant.com.mx/catalogo.html" }
        ]
      }
    ]
  }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block">
  <link rel="stylesheet" href="style.css">
  <style>
    /* ── CATALOG PAGE OVERRIDES ──────────────────────────────── */

    body { background: #fff; }


    /* Catalog hero typography */
    .catalog-page-hero .eyebrow,
    .catalog-page-hero h1,
    .catalog-page-hero p {
      font-family: "Gill Sans MT", "Gill Sans", Calibri, sans-serif;
    }

    /* Catalog section */
    .cat-section { padding: 0; }

    /* Toolbar */
    .cat-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--line);
    }
    .cat-section-label {
      font-family: var(--font-heading);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text);
      white-space: nowrap;
    }
    .cat-toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex: 1;
      justify-content: flex-end;
    }

    /* Search */
    .cat-search {
      position: relative;
      width: 240px;
    }
    .cat-search input {
      width: 100%;
      padding: 0.5rem 0.875rem 0.5rem 2.25rem;
      border: 1px solid var(--line);
      border-radius: 0;
      background: #fff;
      font-family: var(--font-body);
      font-size: 0.8125rem;
      color: var(--text);
      outline: none;
      transition: border-color 180ms ease;
    }
    .cat-search input::placeholder { color: var(--muted); }
    .cat-search input:focus { border-color: var(--text); }
    .cat-search-icon {
      position: absolute;
      left: 0.625rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      display: flex;
      pointer-events: none;
    }
    .cat-search-icon .material-symbols-outlined { font-size: 1rem; }

    /* Refinar button */
    .cat-refinar {
      padding: 0.5rem 1.125rem;
      border: 1px solid var(--text);
      border-radius: 0;
      background: transparent;
      font-family: var(--font-heading);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text);
      cursor: pointer;
      transition: background 180ms ease, color 180ms ease;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      white-space: nowrap;
    }
    .cat-refinar:hover { background: var(--text); color: #fff; }
    .cat-refinar[aria-expanded="true"] { background: var(--text); color: #fff; }

    /* Filter panel: horizontal collapsible */
    .cat-filter-panel {
      display: none;
      flex-wrap: wrap;
      gap: 2.5rem;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--line);
    }
    .cat-filter-panel.open { display: flex; }

    .cat-filter-panel .filter-group {
      margin-bottom: 0;
      min-width: 140px;
    }
    .cat-filter-panel .filter-group-label {
      font-family: var(--font-heading);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text);
      display: block;
      margin-bottom: 0.625rem;
    }
    .cat-filter-panel .filter-options {
      flex-direction: column;
      gap: 0.375rem;
    }
    .cat-filter-panel .filter-option {
      font-size: 0.8125rem;
      color: var(--muted);
      gap: 0.5rem;
    }
    .cat-filter-panel .filter-option input {
      accent-color: var(--green-800);
      width: 13px;
      height: 13px;
    }
    .cat-filter-reset {
      align-self: flex-end;
      padding-bottom: 0.25rem;
      border: none;
      background: transparent;
      font-family: var(--font-heading);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .cat-filter-reset:hover { color: var(--text); }

    /* Count row */
    .cat-meta-row {
      padding: 0.875rem 0;
      border-bottom: 1px solid var(--line);
      margin-bottom: 0;
    }
    .cat-meta-row span {
      font-size: 0.78rem;
      color: var(--muted);
      font-family: var(--font-heading);
    }

    /* Grid: 5 columns, no gap (lines via borders) */
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }

    /* Plant card: flat, minimal */
    .plant-card-v2 {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      border-right: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
      background: #fff;
      transition: background 180ms ease;
    }
    .plant-card-v2:hover { background: #fafaf8; }

    /* Remove right border on last column */
    .plant-card-v2:nth-child(5n) { border-right: none; }

    .pcv2-img {
      aspect-ratio: 1 / 1;
      overflow: hidden;
      background: #f4f4f0;
    }
    .pcv2-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 420ms ease;
    }
    .plant-card-v2:hover .pcv2-img img { transform: scale(1.04); }

    .pcv2-body {
      padding: 0.875rem 1rem 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;
    }
    .pcv2-name {
      font-family: var(--font-heading);
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1.25;
    }
    .pcv2-sci {
      font-size: 0.78rem;
      color: var(--muted);
      font-style: italic;
    }
    .pcv2-sku {
      font-family: var(--font-heading);
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: #c0c8c2;
      text-transform: uppercase;
      margin-top: 0.125rem;
    }
    .pcv2-care {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.5rem;
      margin-top: 0.625rem;
    }
    .pcv2-care-item {
      font-family: var(--font-heading);
      font-size: 0.63rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #a8b5ae;
    }
    .pcv2-care-sep {
      font-size: 0.63rem;
      color: #d0d8d4;
      user-select: none;
    }

    /* Empty state */
    .cat-empty {
      grid-column: 1 / -1;
      padding: 4rem 1rem;
      text-align: center;
    }
    .cat-empty .material-symbols-outlined { font-size: 2.5rem; color: var(--muted); display: block; margin: 0 auto 1rem; }
    .cat-empty h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .cat-empty p { color: var(--muted); font-size: 0.9rem; }

    /* Pagination */
    .pagination {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
      padding: 2rem 0;
      border-top: 1px solid var(--line);
    }
    .pagination button {
      min-width: 2.125rem;
      height: 2.125rem;
      padding: 0 0.5rem;
      background: transparent;
      border: 1px solid var(--line);
      border-radius: 0;
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text);
      cursor: pointer;
      transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .pagination button:hover:not(:disabled):not(.is-active) {
      background: var(--text);
      color: #fff;
      border-color: var(--text);
    }
    .pagination button.is-active {
      background: var(--text);
      color: #fff;
      border-color: var(--text);
      cursor: default;
    }
    .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
    .pagination .pagination-ellipsis {
      min-width: 1.5rem;
      text-align: center;
      color: var(--muted);
      font-family: var(--font-heading);
      font-size: 0.8125rem;
      user-select: none;
    }
    .pagination .pagination-nav .material-symbols-outlined { font-size: 1rem; }

    /* Responsive */
    @media (max-width: 1200px) {
      .cat-grid { grid-template-columns: repeat(4, 1fr); }
      .plant-card-v2:nth-child(5n) { border-right: 1px solid var(--line); }
      .plant-card-v2:nth-child(4n) { border-right: none; }
    }
    @media (max-width: 900px) {
      .cat-grid { grid-template-columns: repeat(3, 1fr); }
      .plant-card-v2:nth-child(4n) { border-right: 1px solid var(--line); }
      .plant-card-v2:nth-child(3n) { border-right: none; }
    }
    @media (max-width: 640px) {
      .cat-toolbar { flex-wrap: wrap; gap: 0.75rem; }
      .cat-toolbar-right { width: 100%; }
      .cat-search { width: 100%; flex: 1; }
      .cat-filter-panel { gap: 1.5rem; }
      .cat-grid { grid-template-columns: repeat(2, 1fr); }
      .plant-card-v2:nth-child(3n) { border-right: 1px solid var(--line); }
      .plant-card-v2:nth-child(2n) { border-right: none; }
      .pcv2-body { padding: 0.75rem 0.75rem 1rem; }
    }
  </style>
  <script type="module" src="js/analytics.js?v=1"></script>
</head>
<body>

  <header class="site-header" id="header">
    <nav class="navbar container">
      <a class="nav-brand" href="/">
        <img src="assets/logo-symbol-web.png" alt="" aria-hidden="true" height="44" class="brand-symbol-img">
        <img src="assets/logo-palabras-web.png" alt="ORNAPLANT" height="28">
      </a>
      <ul class="nav-menu" id="navMenu" role="list">
        <li><a href="/">Inicio</a></li>
        <li><a href="/nosotros.html">Sobre Nosotros</a></li>
        <li><a href="/catalogo.html">Catálogo</a></li>
        <li><a href="/sucursales.html">Sucursales</a></li>
        <li><a href="/horarios.html">Horarios</a></li>
        <li><a href="/contacto.html" class="nav-cta">Contacto</a></li>
      </ul>
      <button class="nav-toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navMenu">
        <span class="material-symbols-outlined" id="navIcon">menu</span>
      </button>
    </nav>
  </header>

  <main>

    <!-- PAGE HERO -->
    <section class="page-hero catalog-page-hero" aria-label="Catálogo de plantas">
      <div class="container">
        <p class="eyebrow"><span class="material-symbols-outlined">local_florist</span>Nuestras plantas</p>
        <h1>Catálogo</h1>
        <p>Explora nuestra selección y consulta disponibilidad directamente.</p>
      </div>
    </section>

    <!-- CATALOG -->
    <section class="cat-section" aria-labelledby="catalog-heading">
      <div class="container">
        <h2 id="catalog-heading" class="sr-only">Catálogo de plantas</h2>

        <!-- TOOLBAR -->
        <div class="cat-toolbar">
          <span class="cat-section-label">Catálogo de plantas</span>
          <div class="cat-toolbar-right">
            <div class="cat-search">
              <span class="cat-search-icon" aria-hidden="true">
                <span class="material-symbols-outlined">search</span>
              </span>
              <input type="search" id="searchInput" placeholder="Buscar por nombre..." aria-label="Buscar plantas">
            </div>
            <button class="cat-refinar" id="filterToggle" aria-expanded="false" aria-controls="filterPanel">
              <span class="material-symbols-outlined" style="font-size:0.875rem;">tune</span>
              Refinar
            </button>
          </div>
        </div>

        <!-- FILTER PANEL (horizontal collapsible) -->
        <div class="cat-filter-panel" id="filterPanel" role="search" aria-label="Panel de filtros">

          <div class="filter-group">
            <span class="filter-group-label" id="cat-label">Categoría</span>
            <div class="filter-options" role="radiogroup" aria-labelledby="cat-label">
              <label class="filter-option"><input type="radio" name="categoria" value="todas" checked> Todas</label>
              <label class="filter-option"><input type="radio" name="categoria" value="interior"> Interior</label>
              <label class="filter-option"><input type="radio" name="categoria" value="exterior"> Exterior</label>
              <label class="filter-option"><input type="radio" name="categoria" value="suculenta"> Suculentas</label>
              <label class="filter-option"><input type="radio" name="categoria" value="ornamental"> Ornamental</label>
              <label class="filter-option"><input type="radio" name="categoria" value="árbol"> Árbol</label>
              <label class="filter-option"><input type="radio" name="categoria" value="medicinal"> Medicinal</label>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-group-label" id="disp-label">Disponibilidad</span>
            <div class="filter-options" role="radiogroup" aria-labelledby="disp-label">
              <label class="filter-option"><input type="radio" name="disponibilidad" value="todas" checked> Todas</label>
              <label class="filter-option"><input type="radio" name="disponibilidad" value="disponible"> Disponible</label>
              <label class="filter-option"><input type="radio" name="disponibilidad" value="bajo pedido"> Bajo pedido</label>
              <label class="filter-option"><input type="radio" name="disponibilidad" value="agotado"> Agotado</label>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-group-label" id="luz-label">Luz necesaria</span>
            <div class="filter-options" role="group" aria-labelledby="luz-label">
              <label class="filter-option"><input type="checkbox" name="luz" value="sol directo"> Sol directo</label>
              <label class="filter-option"><input type="checkbox" name="luz" value="luz indirecta"> Luz indirecta</label>
              <label class="filter-option"><input type="checkbox" name="luz" value="media sombra"> Media sombra</label>
              <label class="filter-option"><input type="checkbox" name="luz" value="sombra"> Sombra</label>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-group-label" id="cuidado-label">Nivel de cuidado</span>
            <div class="filter-options" role="group" aria-labelledby="cuidado-label">
              <label class="filter-option"><input type="checkbox" name="cuidado" value="fácil"> Fácil</label>
              <label class="filter-option"><input type="checkbox" name="cuidado" value="intermedio"> Intermedio</label>
              <label class="filter-option"><input type="checkbox" name="cuidado" value="difícil"> Difícil</label>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-group-label" id="mascotas-label">Mascotas</span>
            <div class="filter-options" role="radiogroup" aria-labelledby="mascotas-label">
              <label class="filter-option"><input type="radio" name="mascotas" value="todas" checked> Todas</label>
              <label class="filter-option"><input type="radio" name="mascotas" value="no tóxica"> No tóxicas</label>
              <label class="filter-option"><input type="radio" name="mascotas" value="tóxica"> Tóxicas</label>
            </div>
          </div>

          <button class="cat-filter-reset" id="resetFilters" type="button">Limpiar filtros</button>
        </div>

        <!-- COUNT -->
        <div class="cat-meta-row">
          <span id="resultCount" aria-live="polite"><?= count($plantasIniciales) ?> plantas</span>
        </div>

        <!-- PLANT GRID -->
        <div class="cat-grid" id="plantGrid" aria-label="Resultados del catálogo">
          <?php foreach ($plantasIniciales as $p): ?>
            <?php
            $rawImgs = $p['imagenes'] ? json_decode($p['imagenes'], true) : [];
            if (!is_array($rawImgs)) $rawImgs = [];
            $img = !empty($rawImgs[0]) ? $rawImgs[0] : 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop';

            $slugRaw = (string)($p['slug'] ?? '');
            $idRaw = (string)$p['id'];
            $link = $slugRaw !== '' ? '/catalogo/' . rawurlencode($slugRaw) : '/planta/' . rawurlencode($idRaw);

            $careMap = [
              'luz' => htmlspecialchars(strtoupper($p['luz'] ?? 'luz indirecta'), ENT_QUOTES, 'UTF-8'),
              'riego' => 'AGUA ' . htmlspecialchars(strtoupper($p['riego'] ?? 'medio'), ENT_QUOTES, 'UTF-8'),
            ];
            ?>
            <a href="<?= htmlspecialchars($link, ENT_QUOTES, 'UTF-8') ?>" class="plant-card-v2" aria-label="Ver detalle de <?= htmlspecialchars($p['nombre'], ENT_QUOTES, 'UTF-8') ?>">
              <div class="pcv2-img">
                <img src="<?= htmlspecialchars($img, ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($p['nombre'], ENT_QUOTES, 'UTF-8') ?> — ORNAPLANT" loading="lazy" width="400" height="400">
              </div>
              <div class="pcv2-body">
                <div class="pcv2-name"><?= htmlspecialchars($p['nombre'], ENT_QUOTES, 'UTF-8') ?></div>
                <div class="pcv2-sci"><?= htmlspecialchars($p['nombre_cientifico'] ?? '', ENT_QUOTES, 'UTF-8') ?></div>
                <?php if (!empty($p['sku'])): ?>
                  <div class="pcv2-sku"><?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?></div>
                <?php endif; ?>
                <div class="pcv2-care" aria-label="Cuidados">
                  <span class="pcv2-care-item"><?= $careMap['luz'] ?></span>
                  <span class="pcv2-care-sep" aria-hidden="true">·</span>
                  <span class="pcv2-care-item"><?= $careMap['riego'] ?></span>
                </div>
              </div>
            </a>
          <?php endforeach; ?>
        </div>

        <nav class="pagination" id="pagination" aria-label="Paginación del catálogo" hidden></nav>

      </div>
    </section>

  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="assets/logo-horizontal-web.png" alt="ORNAPLANT">
          <p>Comercializadora de plantas ornamentales en Morelos. Desde 1992.</p>
        </div>
        <div class="footer-col">
          <h4>Navegación</h4>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/nosotros.html">Sobre Nosotros</a></li>
            <li><a href="/catalogo.html">Catálogo</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Visítanos</h4>
          <ul>
            <li><a href="/sucursales.html">Sucursales</a></li>
            <li><a href="/horarios.html">Horarios</a></li>
            <li><a href="/contacto.html">Contacto</a></li>
            <li><a href="mailto:informesornaplant@hotmail.com">Enviar email</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 ORNAPLANT SA DE CV · Cuautla, Morelos</span>
        <span>Plantas ornamentales desde 1992 · <a href="admin.html" style="opacity: 0.7; text-decoration: none;">Acceso Admin</a></span>
      </div>
    </div>
  </footer>

  <button class="back-to-top" id="backToTop" aria-label="Volver arriba">
    <span class="material-symbols-outlined">keyboard_arrow_up</span>
  </button>

  <script type="module">
    import { getPlants } from './api.js?v=2';
    import { WHATSAPP_NUMBER } from './config.js?v=2';

    (async function () {
      const grid = document.getElementById('plantGrid');
      let plantas = [];

      function plantCard(p) {
        const img = (p.imagenes && p.imagenes[0]) || 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop';
        const href = p.slug ? `/catalogo/${encodeURIComponent(p.slug)}` : `/planta/${encodeURIComponent(p.id)}`;
        const luzLabel = (p.luz || 'luz indirecta').toUpperCase();
        const riegoLabel = 'AGUA ' + (p.riego || 'medio').toUpperCase();
        const skuHtml = p.sku ? `<div class="pcv2-sku">${p.sku}</div>` : '';
        return `
          <a href="${href}" class="plant-card-v2" aria-label="Ver detalle de ${p.nombre}">
            <div class="pcv2-img">
              <img src="${img}" alt="${p.nombre} — ORNAPLANT" loading="lazy" width="400" height="400">
            </div>
            <div class="pcv2-body">
              <div class="pcv2-name">${p.nombre}</div>
              <div class="pcv2-sci">${p.nombreCientifico || ''}</div>
              ${skuHtml}
              <div class="pcv2-care" aria-label="Cuidados">
                <span class="pcv2-care-item">${luzLabel}</span>
                <span class="pcv2-care-sep" aria-hidden="true">·</span>
                <span class="pcv2-care-item">${riegoLabel}</span>
              </div>
            </div>
          </a>`;
      }

      let filters = { search: '', categoria: 'todas', disponibilidad: 'todas', luz: [], cuidado: [], mascotas: 'todas' };

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('categoria')) {
        filters.categoria = urlParams.get('categoria') || 'todas';
        document.querySelectorAll('input[name="categoria"]').forEach(r => { r.checked = r.value === filters.categoria; });
      }
      if (urlParams.has('disponibilidad')) {
        filters.disponibilidad = urlParams.get('disponibilidad') || 'todas';
        document.querySelectorAll('input[name="disponibilidad"]').forEach(r => { r.checked = r.value === filters.disponibilidad; });
      }

      let currentPage = 1;
      let currentList = [];
      const ROWS_PER_PAGE = 3;
      const pagEl = document.getElementById('pagination');
      let hasRenderedClient = false;

      function getColumns() {
        const cs = getComputedStyle(grid).gridTemplateColumns;
        return Math.max(1, cs.split(' ').filter(Boolean).length);
      }

      function pageSize() { return getColumns() * ROWS_PER_PAGE; }

      function applyFilters() {
        const q = filters.search.toLowerCase();
        currentList = plantas.filter(p => {
          if (q && !p.nombre.toLowerCase().includes(q) && !(p.nombreCientifico || '').toLowerCase().includes(q) && !(p.descripcion || '').toLowerCase().includes(q)) return false;
          if (filters.categoria !== 'todas' && p.categoria !== filters.categoria) return false;
          if (filters.disponibilidad !== 'todas' && (p.disponibilidad || '').toLowerCase() !== filters.disponibilidad.toLowerCase()) return false;
          if (filters.luz.length && !filters.luz.includes(p.luz)) return false;
          if (filters.cuidado.length && !filters.cuidado.includes(p.cuidado)) return false;
          if (filters.mascotas !== 'todas' && p.mascotas !== filters.mascotas) return false;
          return true;
        });
        currentPage = 1;
        render();
      }

      function render() {
        hasRenderedClient = true;
        const count = document.getElementById('resultCount');
        count.textContent = `${currentList.length} planta${currentList.length !== 1 ? 's' : ''}`;
        if (currentList.length === 0) {
          const waMsg = encodeURIComponent('Hola, no encontré lo que buscaba en el catálogo. ¿Me pueden ayudar?');
          grid.innerHTML = `<div class="cat-empty"><span class="material-symbols-outlined">search_off</span><h3>Sin resultados</h3><p>¿No encuentras lo que buscas? <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}" target="_blank" rel="noopener noreferrer" style="color:var(--green-800);font-weight:700;text-decoration:underline;">¡Escríbenos!</a></p></div>`;
          pagEl.hidden = true;
          pagEl.innerHTML = '';
          return;
        }
        const size = pageSize();
        const totalPages = Math.max(1, Math.ceil(currentList.length / size));
        if (currentPage > totalPages) currentPage = totalPages;
        const slice = currentList.slice((currentPage - 1) * size, currentPage * size);
        grid.innerHTML = slice.map(plantCard).join('');
        renderPagination(totalPages);
      }

      function renderPagination(totalPages) {
        if (totalPages <= 1) { pagEl.hidden = true; pagEl.innerHTML = ''; return; }
        pagEl.hidden = false;
        const WINDOW = 3;
        const pages = new Set([1, totalPages]);
        for (let i = currentPage - WINDOW; i <= currentPage + WINDOW; i++) {
          if (i >= 1 && i <= totalPages) pages.add(i);
        }
        const sorted = [...pages].sort((a, b) => a - b);
        const parts = [];
        parts.push(`<button type="button" class="pagination-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior"><span class="material-symbols-outlined">chevron_left</span></button>`);
        let prev = 0;
        for (const p of sorted) {
          if (prev && p - prev > 1) parts.push(`<span class="pagination-ellipsis" aria-hidden="true">…</span>`);
          parts.push(`<button type="button" data-page="${p}" class="${p === currentPage ? 'is-active' : ''}" ${p === currentPage ? 'aria-current="page"' : ''}>${p}</button>`);
          prev = p;
        }
        parts.push(`<button type="button" class="pagination-nav" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Página siguiente"><span class="material-symbols-outlined">chevron_right</span></button>`);
        pagEl.innerHTML = parts.join('');
      }

      pagEl.addEventListener('click', e => {
        const btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        const p = parseInt(btn.dataset.page, 10);
        if (!p || p === currentPage) return;
        currentPage = p;
        render();
        const top = (document.getElementById('catalog-heading')?.getBoundingClientRect().top || 0) + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      });

      let resizeTimer;
      let lastSize = 0;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const s = pageSize();
          if (hasRenderedClient && s !== lastSize) { lastSize = s; render(); }
        }, 150);
      });

      document.getElementById('searchInput').addEventListener('input', e => {
        filters.search = e.target.value.trim();
        applyFilters();
      });

      document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
          filters[input.name] = input.value;
          applyFilters();
        });
      });

      document.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
          const key = input.name;
          if (!Array.isArray(filters[key])) filters[key] = [];
          if (input.checked) filters[key].push(input.value);
          else filters[key] = filters[key].filter(v => v !== input.value);
          applyFilters();
        });
      });

      document.getElementById('resetFilters').addEventListener('click', () => {
        filters = { search: '', categoria: 'todas', disponibilidad: 'todas', luz: [], cuidado: [], mascotas: 'todas' };
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = r.value === 'todas'; });
        document.querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = false; });
        applyFilters();
      });

      const filterToggle = document.getElementById('filterToggle');
      const filterPanel = document.getElementById('filterPanel');
      filterToggle.addEventListener('click', () => {
        const open = filterPanel.classList.toggle('open');
        filterToggle.setAttribute('aria-expanded', String(open));
      });

      try {
        plantas = await getPlants();
        currentList = plantas;
        lastSize = pageSize();
        applyFilters();
      } catch (e) {
        // red fallo — SSR PHP grid permanece visible
      }
    })();
  </script>
  <script src="script.js"></script>
</body>
</html>
