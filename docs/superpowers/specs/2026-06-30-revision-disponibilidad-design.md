# Diseño: Revisión de fotos (interna) + renombrar "bajo pedido" → "de temporada"

Fecha: 2026-06-30
Estado: aprobado (diseño) — v2, reemplaza diseño anterior en este mismo
archivo (cálculo automático de disponibilidad fue descartado).

## Objetivo

Soportar la revisión física de 600+ plantas del catálogo (fotos generadas
por IA que no siempre corresponden a la planta real), con un estado de
revisión **puramente interno** para que el dueño lleve la cuenta en el
panel admin. Cero efecto sobre el catálogo público: disponibilidad sigue
siendo 100% manual, exactamente como funciona hoy. De paso, renombrar el
valor de disponibilidad `bajo pedido` → `de temporada`.

Este es el **Subsistema A** de un pedido más grande de 3 partes
independientes (revisión, SEO nacional, mayoreo/menudeo). Los otros dos se
brainstorman después, en specs separados.

## Historial de decisiones de este spec (por qué se ve así)

Este diseño pasó por dos vueltas grandes:
1. Primera versión: disponibilidad calculada automáticamente
   (`revisión correcta` AND `existencia`), columna `GENERATED`, catálogo
   se vaciaba hasta revisar todo. **Descartada** — el usuario pidió que la
   revisión no tenga ninguna consecuencia en el catálogo.
2. Historial de cambios de revisión (tabla + trigger MySQL). **Descartado**
   — decisión explícita de simplicidad, confirmada dos veces pese a
   contradecir el requisito original de "no perder el hilo".

Lo que queda (esta versión) es deliberadamente chico.

## Decisiones (confirmadas con el usuario)

- `revision_estado`: tres valores — `no revisada`, `correcta`, `incorrecta`.
  Campo interno, editable en panel admin, **sin ningún efecto** en
  disponibilidad, orden del catálogo, ni nada visible al cliente.
- Sin campo `existencia` — se descarta, no se necesita.
- Sin historial de cambios — sin tabla, sin trigger, sin "quién"/"cuándo".
- Disponibilidad sigue siendo la columna manual de siempre (`disponible`,
  `de temporada`, `agotado`) — el dueño/editor la edita a mano como hoy.
  No se toca el esquema de esa columna, no hay acción de migración sobre
  datos existentes (ya arrancan en `disponible` por `DEFAULT`).
- Renombrar enum `bajo pedido` → `de temporada` en validación backend,
  filtro del catálogo público y `CLAUDE.md`. Datos existentes con el valor
  viejo (`bajo pedido`) se migran al nuevo (`de temporada`).
- Permisos: `revision_estado` editable por dueño y editor (igual que el
  resto del inventario). Reinicio masivo a "no revisada": solo dueño,
  confirmación escrita (irreversible, sin historial para recuperar).
- Foto anterior (IA) al reemplazar: se conserva en `imagenes_historial`
  (array JSON en la misma fila) — esto sigue en pie, es respaldo de
  archivo, no tiene relación con la decisión de revisión/disponibilidad.
- Orden del catálogo público: `disponible + popular` → `disponible` →
  `de temporada` → `agotado`. `de temporada` tiene su propio nivel porque,
  a diferencia de agotado, el cliente puede seguir interesado.

## 1. Esquema (`sql/migrations/005_revision_estado.sql`)

```sql
ALTER TABLE plantas
  ADD COLUMN revision_estado    VARCHAR(20) NOT NULL DEFAULT 'no revisada' AFTER disponibilidad,
  ADD COLUMN imagenes_historial JSON        NULL                          AFTER imagenes;

-- Migrar valor viejo del enum de disponibilidad.
UPDATE plantas SET disponibilidad = 'de temporada' WHERE disponibilidad = 'bajo pedido';
```

Sin columna `GENERATED`, sin `existencia`, sin tabla nueva, sin trigger.
`disponibilidad` no cambia de tipo ni de comportamiento — sigue siendo
`VARCHAR(50)` editable a mano vía `api/admin/plantas.php`, solo cambia el
conjunto de valores válidos.

## 2. Backend admin (`api/admin/plantas.php`)

- `ENUMS['disponibilidad']`: `['disponible', 'de temporada', 'agotado']`
  (antes `'bajo pedido'`).
- `ENUMS['revision_estado']` (nuevo): `['no revisada', 'correcta', 'incorrecta']`.
- `$allowed` en `build_payload()`: agregar `revision_estado` (sigue
  incluyendo `disponibilidad`, sin cambios ahí — sigue siendo de lectura Y
  escritura manual).
- `decode_planta()`: decodificar `imagenes_historial` igual que los demás
  campos JSON (`etiquetas`, `variaciones`, `imagenes`).
- Reemplazo de imagen: cuando `PUT` trae un nuevo array `imagenes`
  distinto al actual, las URLs que ya no estén en el nuevo array se
  agregan (append, sin duplicar) a `imagenes_historial` antes de guardar.
- Acción nueva `PATCH /admin/plantas.php?action=reset_revision`:
  `require_owner()` explícito (más estricto que el `require_admin()` del
  resto del archivo) → `UPDATE plantas SET revision_estado = 'no revisada'`
  sin condición (todas las filas).

## 3. Backend público (`api/plantas.php`, `catalogo.php`)

- `revision_estado` e `imagenes_historial` **nunca** se exponen en
  endpoints públicos — excluir explícitamente de la query o del
  `decode_planta()` público (defensa en profundidad, son datos puramente
  internos de auditoría de fotos).
- `catalogo.php`: renombrar label/value del filtro "Bajo pedido" →
  "De temporada" (mismo radio, mismo comportamiento de filtro).
- Orden del catálogo (client-side, después de `getPlants()`, sin tocar el
  endpoint): cuatro niveles —
  1. `disponible` + etiqueta `popular`/`recomendada`
  2. `disponible` sin esas etiquetas
  3. `de temporada`
  4. `agotado`
  Dentro de cada nivel se conserva el orden que ya trae la API
  (`creado_en DESC`).

## 4. Frontend admin

`admin.html`:
- `<select>` de Disponibilidad existente: cambiar `<option value="bajo pedido">`
  por `<option value="de temporada">Bajo pedido` → `De temporada` (modal +
  cualquier filtro admin que use ese enum).
- Agregar `<select>` de Revisión (3 estados) — nuevo, junto al de
  Disponibilidad en lista inline + modal. Visualmente distinto (ej. ícono
  de "verificación") para que quede claro que es un campo aparte, interno.
- Botón "Reiniciar todas a no revisada" — `owner-only`. Confirmación que
  exige escribir una palabra (blast radius 600+ filas, sin historial para
  deshacer).

`js/admin/admin-ui-list.js`:
- Agregar select de revisión inline junto al de disponibilidad (ambos
  coexisten, son campos independientes), mismo patrón de guardado
  optimista + rollback en error.

`js/admin/admin-form.js`:
- Agregar campo `f-revision` al modal (no reemplaza `f-disp`, coexisten).
- Mini-galería de `imagenes_historial` (miniaturas, solo lectura) dentro
  del modal, visible si la planta tiene fotos reemplazadas.

`js/admin/admin-ui-stats.js`:
- Contador "X por revisar / Y revisadas / Z incorrectas" — calculado del
  array de plantas que ya se carga completo para la lista (sin endpoint
  nuevo).

`js/admin/admin-events.js`:
- Cablear el nuevo select de revisión inline + el botón de reinicio
  masivo (incluyendo el modal de confirmación escrita).

`api.js`:
- `resetRevision()` → `PATCH /admin/plantas.php?action=reset_revision`.

## 5. Documentación

`CLAUDE.md`: actualizar la tabla de valores válidos —
`disponibilidad: disponible | de temporada | agotado` (antes incluía
`bajo pedido`).

## Archivos

**Nuevos**
- `sql/migrations/005_revision_estado.sql`

**Modificados**
- `api/admin/plantas.php` — `ENUMS`, `$allowed`, `decode_planta`, manejo
  de `imagenes_historial`, acción `reset_revision`.
- `api/plantas.php` — excluir campos internos de la respuesta pública.
- `catalogo.php` — label "de temporada", orden de cuatro niveles.
- `api.js` — `resetRevision()`.
- `admin.html` — select de revisión nuevo, label renombrado, botón
  reinicio, mini-galería de historial de imágenes.
- `js/admin/admin-ui-list.js` — select de revisión inline.
- `js/admin/admin-form.js` — campo de revisión en modal, mini-galería.
- `js/admin/admin-ui-stats.js` — contador por estado de revisión.
- `js/admin/admin-events.js` — cableado de eventos nuevos.
- `CLAUDE.md` — tabla de valores enum actualizada.

## Seguridad / no romper nada

- `revision_estado` e `imagenes_historial` nunca viajan a endpoints
  públicos, ni por accidente vía `SELECT *`.
- `reset_revision` exige `require_owner()` explícito, no solo el
  `require_admin()` del resto del archivo.
- Disponibilidad sigue funcionando exactamente igual que hoy (mismo tipo
  de columna, mismo flujo de edición) — el único cambio real ahí es el
  valor de un enum, no la mecánica.
- Sin historial: el reinicio masivo es irreversible, la confirmación
  escrita debe dejarlo claro en el UI.

## Pruebas

Checklist manual (PHP local + MySQL):
1. Aplicar migración; plantas con `disponibilidad='bajo pedido'` quedan en
   `'de temporada'`; nuevas filas traen `revision_estado='no revisada'`.
2. Cambiar `revision_estado` de una planta a `correcta` → disponibilidad
   pública de esa planta no cambia (sigue lo que tenía antes).
3. Cambiar `disponibilidad` a mano (como siempre) → funciona igual que
   hoy, sin relación con `revision_estado`.
4. Reemplazar `imagenes` de una planta → la URL vieja aparece en
   `imagenes_historial`, no se pierde.
5. Login Editor: puede cambiar revisión y disponibilidad; NO ve botón de
   reinicio masivo; `PATCH ?action=reset_revision` con su token da 403.
6. Login Dueño: reinicio masivo pide confirmación escrita, después todas
   las plantas quedan en `no revisada` (disponibilidad sin tocar).
7. Catálogo público: orden disponible+popular → disponible → de temporada
   → agotado; filtro muestra "De temporada" en vez de "Bajo pedido".
8. Inspeccionar respuesta JSON de `api/plantas.php` (público) — confirmar
   que no trae `revision_estado` ni `imagenes_historial`.

## Deploy a Hostinger (orden)

1. **MySQL** (phpMyAdmin): ejecutar `sql/migrations/005_revision_estado.sql`.
   Sin impacto visible en catálogo público (disponibilidad no cambia,
   salvo el rename de `bajo pedido`).
2. **PHP**: subir `api/admin/plantas.php`, `api/plantas.php`, `catalogo.php`.
3. **Frontend**: subir `admin.html`, `api.js`, `js/admin/admin-ui-list.js`,
   `js/admin/admin-form.js`, `js/admin/admin-ui-stats.js`,
   `js/admin/admin-events.js`.

## Pendiente (fuera de este spec)

- **Subsistema B** — SEO nacional: `sitemap.xml` no existe pese a estar
  referenciado en `robots.txt`; contenido para demostrar venta a todo el
  país. Spec separado.
- **Subsistema C** — separación mayoreo/menudeo: carrito multi-selección
  con mensaje de WhatsApp ordenado (nombres, luego SKUs), restricción
  geográfica para menudeo (solo sucursal), envío solo mayoreo. Requiere
  definir mecanismo de detección mayorista/menudeo — varias preguntas
  abiertas, spec separado.
