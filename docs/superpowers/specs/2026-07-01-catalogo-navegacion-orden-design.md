# Diseño: flecha de volver + orden por vistas en catálogo

**Fecha:** 2026-07-01
**Estado:** Aprobado, pendiente de plan de implementación

## Contexto

Tres pedidos relacionados con navegación y orden del catálogo:

1. En `planta.php`, agregar una flecha para volver al catálogo (o a la página anterior) cerca del breadcrumb (`catalogo/interior/planta`).
2. Mejorar el algoritmo de orden del catálogo (`catalogo.php`) para que no dependa solo de orden alfabético / de llegada.
3. Que las vistas de cada planta (recopiladas y visibles en el panel admin) influyan en ese orden.

### Estado actual verificado

- `planta.php:243-249` ya tiene un `<nav class="breadcrumb">` con: `Catálogo / {Categoría} / {Nombre}`. No tiene flecha ni acción de "volver".
- `catalogo.php:717-738`: el orden se calcula con `tierOf(p)` (disponible+popular=0, disponible=1, de temporada=2, agotado=3) y luego `currentList.sort((a,b) => tierOf(a) - tierOf(b))`. Como `Array.sort` es estable, dentro de cada tier el orden queda como llegó del API.
- `api/plantas.php:58-60`: el listado público hace `SELECT * FROM plantas ... ORDER BY creado_en DESC` — es decir, dentro de cada tier el orden real hoy es "más reciente primero", no alfabético (aunque puede percibirse como un orden fijo/arbitrario).
- El campo `vistas` **ya viaja** en el listado público (`api/plantas.php:22`, dentro de `decode_planta()`), se incrementa en cada visita a `planta.php` vía `script.js:99` (`PATCH .../plantas.php?id=X&action=incrementar_vistas`), y ya se muestra en el panel admin (`api/admin/plantas.php:39`). No hace falta tocar backend ni esquema de BD.

## Diseño

### 1. Flecha de volver en `planta.php`

En el breadcrumb existente (`planta.php:243`), se agrega un ícono `arrow_back` al inicio, como parte del mismo `<nav class="breadcrumb">`.

- Es un `<a>` real con `href="<?= $base ?>/catalogo.html"` (funciona sin JS, con click derecho / abrir en pestaña nueva, etc.).
- Se agrega un handler JS pequeño (en uno de los bloques `<script>` inline ya existentes en `planta.php`, sin archivo nuevo) que:
  - Si `document.referrer` es del mismo origen **y** `window.history.length > 1`, intercepta el click y llama a `history.back()` — esto preserva filtros y página en la que estaba el usuario en `catalogo.php`.
  - Si no, deja el comportamiento normal del link (`href` a `catalogo.html`).
- Estilo: reutiliza clases `.breadcrumb` / `.breadcrumb a` ya definidas en `planta.php:184-187`; el ícono usa Material Symbols (`arrow_back`), igual que el resto del sitio.

### 2. Orden del catálogo (`catalogo.php`)

Se mantiene el sistema de tiers actual (`tierOf`), que ya tiene sentido de negocio (disponible+popular primero, agotado al final). El cambio es en el criterio **secundario**, dentro de cada tier: pasa de ser "orden de llegada del API" (implícito) a **vistas descendente**:

```js
currentList.sort((a, b) => tierOf(a) - tierOf(b) || (b.vistas - a.vistas));
```

- `p.vistas` ya está disponible en cada objeto planta del array `plantas` (viene del API sin cambios).
- Por estabilidad de `Array.sort` (ES2019+, ya usada y documentada en el comentario existente en `catalogo.php:737`), los empates en vistas (p. ej. dos plantas nuevas con 0 vistas) conservan el orden de llegada del API (`creado_en DESC`) — así una planta recién agregada no queda invisible al fondo del tier solo por no tener vistas todavía.

### 3. Conexión con vistas del panel admin

No requiere cambio de código: el mismo campo `vistas` que ya se muestra en el admin (`api/admin/plantas.php:39`) es el que ahora determina el orden del catálogo público. El pedido de "que las vistas tengan que ver" queda resuelto por el punto 2.

## Archivos afectados

- `planta.php` — breadcrumb + script inline (flecha de volver).
- `catalogo.php` — comparador de `sort` en `applyFilters()` (línea 738).

Sin cambios en `api/`, `sql/`, ni en el panel admin.

## Fuera de alcance

- No se agrega ranking ponderado (vistas + fecha combinadas en un score) — se descartó explícitamente a favor de vistas puras con desempate estable por fecha.
- No se cambia el sistema de tiers de disponibilidad.
- No se agregan endpoints ni columnas nuevas.
