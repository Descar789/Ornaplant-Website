# Diseño: Revisión física de fotos + disponibilidad automática

Fecha: 2026-06-30
Estado: aprobado (diseño)

## Objetivo

Soportar la revisión física de 600+ plantas del catálogo (fotos generadas
por IA que no siempre corresponden a la planta real). Agregar un estado de
revisión interno por planta, hacer que la disponibilidad que ve el cliente
se calcule sola (revisión correcta + existencia real, nunca a mano), y
reordenar el catálogo público para priorizar lo disponible y popular.

Este es el **Subsistema A** de un pedido más grande de 3 partes
independientes (revisión/disponibilidad, SEO nacional, mayoreo/menudeo).
Los otros dos se brainstorman después, en specs separados.

## Decisiones (confirmadas con el usuario)

- Estado de revisión: tres valores — `no revisada`, `correcta`, `incorrecta`.
  Interno, nunca visible ni inferible por el cliente.
- Existencia real: campo booleano simple (sí/no hay stock), no cantidad.
- Disponibilidad pública = `revisión correcta` AND `existencia = sí`. Si
  falta cualquiera de las dos, el cliente ve "agotada" — sin distinguir el
  motivo. El enum `bajo pedido` desaparece; queda binario.
- **Sin historial de cambios.** Decisión explícita y confirmada dos veces
  pese a contradecir el requisito original de "no perder el hilo" — el
  usuario prefiere simplicidad. Sin tabla, sin trigger, sin "quién"/"cuándo"
  de cambios pasados. Solo existe el estado actual.
- Migración: todas las plantas arrancan en `no revisada`. Consecuencia
  aceptada: el catálogo público se ve vacío (todo "agotado") el día que se
  aplique, hasta que se vaya revisando en campo.
- Permisos: revisión y existencia editables por dueño y editor (igual que
  el resto del inventario). Reinicio masivo a "no revisada": solo dueño.
- Foto anterior (IA) al reemplazar: se conserva en `imagenes_historial`
  (array JSON en la misma fila) — esto es respaldo de archivo, no bitácora
  de cambios, así que no lo afecta la decisión de "sin historial".

## 1. Esquema (`sql/migrations/005_revision_disponibilidad.sql`)

```sql
ALTER TABLE plantas
  ADD COLUMN revision_estado    VARCHAR(20) NOT NULL DEFAULT 'no revisada' AFTER disponibilidad,
  ADD COLUMN existencia         TINYINT(1)  NOT NULL DEFAULT 0             AFTER revision_estado,
  ADD COLUMN imagenes_historial JSON        NULL                          AFTER imagenes;

-- Todas arrancan "no revisada" — ya es el DEFAULT, no hace falta UPDATE.

-- disponibilidad pasa de columna libre a columna calculada por MySQL.
-- No se puede escribir directo (INSERT/UPDATE con esta columna truena).
ALTER TABLE plantas
  MODIFY COLUMN disponibilidad VARCHAR(20)
  GENERATED ALWAYS AS (
    CASE WHEN revision_estado = 'correcta' AND existencia = 1
         THEN 'disponible' ELSE 'agotado' END
  ) STORED;
```

Verificar versión de MySQL en Hostinger antes de aplicar — columnas
`GENERATED ... STORED` requieren MySQL 5.7.6+ / MariaDB 5.2+. Si la versión
no soporta `GENERATED`, plan B: columna normal + recalcular en cada
INSERT/UPDATE desde PHP (menos elegante, mismo resultado).

`disponibilidad` generada sigue siendo indexable y consultable igual que
antes (`WHERE disponibilidad = 'disponible'` no cambia).

## 2. Backend admin (`api/admin/plantas.php`)

- `ENUMS`: quitar `disponibilidad` (ya no se valida ni se acepta). Agregar
  `revision_estado => ['no revisada', 'correcta', 'incorrecta']`.
- `$allowed` en `build_payload()`: quitar `disponibilidad`, agregar
  `revision_estado` y `existencia` (cast `existencia` a `0`/`1`).
- `decode_planta()`: decodificar `imagenes_historial` igual que los demás
  campos JSON (`etiquetas`, `variaciones`, `imagenes`); devolver
  `existencia` como `(int)`; `disponibilidad` se sigue devolviendo igual
  (ahora viene calculada de la DB, transparente para el frontend admin).
- Reemplazo de imagen: cuando `PUT` trae un nuevo array `imagenes` distinto
  al actual, las URLs que ya no estén en el nuevo array se agregan
  (append, sin duplicar) a `imagenes_historial` antes de guardar.
- Acción nueva `PATCH /admin/plantas.php?action=reset_revision`:
  `require_owner()` explícito (más estricto que el `require_admin()` del
  resto del archivo) → `UPDATE plantas SET revision_estado = 'no revisada'`
  sin condición (todas las filas). `existencia` no se toca.

## 3. Backend público (`api/plantas.php`, `catalogo.php`)

- Cambiar `SELECT *` por lista explícita de columnas en ambos archivos,
  **excluyendo** `revision_estado`, `existencia`, `imagenes_historial` —
  defensa en profundidad: aunque alguien olvide filtrar en el PHP, la
  columna ni siquiera viaja en la query.
- `decode_planta()` público: sin cambios estructurales (ya no tiene esos
  campos que ocultar, vienen excluidos desde el SQL).
- `catalogo.php`: quitar el radio "Bajo pedido" del filtro de
  disponibilidad (queda Todas / Disponible / Agotado).
- Orden del catálogo (client-side, después de `getPlants()`, sin tocar el
  endpoint): tres niveles —
  1. `disponible` + etiqueta `popular`/`recomendada`
  2. `disponible` sin esas etiquetas
  3. todo lo demás (agotado, sin distinguir motivo)
  Dentro de cada nivel se conserva el orden que ya trae la API
  (`creado_en DESC`).

## 4. Frontend admin

`admin.html`:
- Quitar el `<select>` de Disponibilidad (modal de planta y plantilla de
  fila de la lista).
- Agregar `<select>` de Revisión (3 estados) y toggle de Existencia, en los
  mismos dos lugares (lista inline + modal), mismo patrón visual que el
  select de disponibilidad que reemplazan.
- Botón "Reiniciar todas a no revisada" — sidebar o junto a "Agregar
  Planta", clase `owner-only`. Abre confirmación que exige escribir una
  palabra (no el confirm de 2 clics que usa borrar planta — acá el blast
  radius es 600+ filas y, sin historial, no hay forma de deshacer).

`js/admin/admin-ui-list.js`:
- Reemplazar el select de disponibilidad inline por los de revisión +
  existencia, mismo patrón de guardado optimista + rollback en error.
- Filtro de disponibilidad en la lista sigue funcionando igual (el campo
  calculado se sigue pudiendo filtrar).

`js/admin/admin-form.js`:
- Reemplazar campo `f-disp` por los nuevos `f-revision` y `f-existencia`.
- Mini-galería de `imagenes_historial` (miniaturas, solo lectura) dentro
  del modal, visible si la planta tiene fotos reemplazadas.

`js/admin/admin-ui-stats.js`:
- Contador "X por revisar / Y revisadas / Z incorrectas" — calculado del
  array de plantas que ya se carga completo para la lista (sin endpoint
  nuevo, sin round-trip extra).

`js/admin/admin-events.js`:
- Cablear los nuevos selects inline + el botón de reinicio masivo
  (incluyendo el modal de confirmación escrita).

`api.js`:
- `resetRevision()` → `PATCH /admin/plantas.php?action=reset_revision`.

## Archivos

**Nuevos**
- `sql/migrations/005_revision_disponibilidad.sql`

**Modificados**
- `api/admin/plantas.php` — ENUMS, `$allowed`, `decode_planta`, manejo de
  `imagenes_historial`, acción `reset_revision`.
- `api/plantas.php` — columnas explícitas, sin exponer campos internos.
- `catalogo.php` — columnas explícitas, quitar filtro "bajo pedido", orden
  de tres niveles.
- `api.js` — `resetRevision()`.
- `admin.html` — selects de revisión/existencia, botón reinicio, mini-
  galería de historial de imágenes.
- `js/admin/admin-ui-list.js` — selects inline nuevos.
- `js/admin/admin-form.js` — campos del modal, mini-galería.
- `js/admin/admin-ui-stats.js` — contador por estado de revisión.
- `js/admin/admin-events.js` — cableado de eventos nuevos.

## Seguridad / no romper nada

- `disponibilidad` generada no se puede escribir directo — si algún código
  viejo todavía la manda en el payload, el `UPDATE`/`INSERT` falla con
  error de MySQL (columna generada). Hay que asegurarse de que ningún
  `$allowed` ni formulario la siga mandando antes de desplegar.
- Endpoints públicos nunca seleccionan ni devuelven `revision_estado`,
  `existencia`, `imagenes_historial` — ni por accidente vía `SELECT *`.
- `reset_revision` exige `require_owner()` explícito, no solo el
  `require_admin()` del resto del archivo.
- Sin historial: documentar bien que el reinicio masivo es irreversible
  (perfil/UX debe dejarlo clarísimo en la confirmación).

## Pruebas

Checklist manual (PHP local + MySQL):
1. Aplicar migración; verificar que `disponibilidad` quedó como columna
   `GENERATED` (intentar un `UPDATE plantas SET disponibilidad='x'` directo
   por SQL debe fallar).
2. Planta nueva: `revision_estado='no revisada'` por default → pública
   sale como `agotado`.
3. Marcar `revision_estado='correcta'` + `existencia=1` → pública pasa a
   `disponible`.
4. Quitar cualquiera de las dos condiciones → vuelve a `agotado`.
5. Reemplazar `imagenes` de una planta → la URL vieja aparece en
   `imagenes_historial`, no se pierde.
6. Login Editor: puede cambiar revisión/existencia; NO ve botón de
   reinicio masivo; `PATCH ?action=reset_revision` con su token da 403.
7. Login Dueño: reinicio masivo pide confirmación escrita, después todas
   las plantas quedan en `no revisada`.
8. Catálogo público: orden disponible+popular → disponible → resto;
   filtro "bajo pedido" ya no existe en el UI.
9. Inspeccionar respuesta JSON de `api/plantas.php` (público) — confirmar
   que no trae `revision_estado`, `existencia` ni `imagenes_historial` en
   ningún campo.

## Deploy a Hostinger (orden)

1. **MySQL** (phpMyAdmin): ejecutar `sql/migrations/005_revision_disponibilidad.sql`.
   Catálogo público queda vacío (todo agotado) hasta empezar a revisar.
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
