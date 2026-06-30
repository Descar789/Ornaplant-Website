# Diseño: Bitácora de auditoría del catálogo de plantas

Fecha: 2026-06-30
Estado: **superado** — basado en versión truncada del pedido original.
Ver `2026-06-30-revision-disponibilidad-design.md` para el sistema real
(revisión de fotos + disponibilidad automática), que reemplaza esto.

## Objetivo

Registrar quién hizo qué cambio (crear/editar/borrar) en cada planta del
catálogo y cuándo. Bitácora pura — sin diff de campos, sin flujo de
aprobación. Los cambios de Editor se aplican directo, igual que hoy; solo
quedan registrados para que el Dueño pueda auditarlos.

## Decisiones (confirmadas con el usuario)

- Tipo: solo bitácora (audit log), no aprobación de cambios.
- Acciones registradas: crear, editar, borrar planta.
- Detalle por entrada: solo metadata (quién, cuándo, qué planta, qué acción)
  — sin diff de campos ni snapshot de valores antes/después.
- UI: modal global "Auditoría" (mismo patrón que "Gestionar perfiles") +
  mini-historial dentro del modal de editar planta.
- Visibilidad: solo Dueño (`require_owner`), igual que gestión de perfiles.

## 1. Tabla nueva `bitacora`

`sql/migrations/005_bitacora.sql`:

```sql
CREATE TABLE bitacora (
  id            INT           NOT NULL AUTO_INCREMENT,
  admin_id      INT           NULL,
  admin_email   VARCHAR(150)  NOT NULL,
  accion        VARCHAR(20)   NOT NULL,   -- 'crear' | 'editar' | 'borrar'
  planta_id     VARCHAR(100)  NOT NULL,
  planta_nombre VARCHAR(150)  NOT NULL DEFAULT '',
  creado_en     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bitacora_planta (planta_id),
  KEY idx_bitacora_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Sin `FOREIGN KEY` a `admins` ni a `plantas`: ambos se pueden borrar y la
bitácora debe seguir siendo legible. `admin_email` y `planta_nombre` son
snapshots tomados en el momento del cambio.

## 2. Logging en `api/admin/plantas.php`

- Capturar el payload del JWT: `$caller = require_admin();` (hoy se llama
  sin guardar el valor de retorno).
- Tras cada operación exitosa (INSERT / UPDATE / DELETE), insertar una fila
  en `bitacora` con `admin_id = $caller['sub']`, `admin_email = $caller['email']`.
- El insert de bitácora va en su propio `try/catch`; si falla, se ignora
  (o se manda a `error_log`) pero **la operación CRUD ya respondió éxito** —
  el logging nunca debe tumbar una operación real.
- Nombre de planta por acción:
  - **crear**: `$payload['nombre']` del body (siempre presente, es requerido).
  - **editar**: nombre actual de la planta (ya se consulta para el slug;
    reusar esa fila o hacer `SELECT nombre` si no se consultó).
  - **borrar**: `SELECT nombre FROM plantas WHERE id = :id` **antes** del
    `DELETE` (después ya no existe la fila).

## 3. Endpoint nuevo `api/admin/bitacora.php`

- Solo `GET`, protegido con `require_owner()`.
- Filtros opcionales por query string: `planta_id`, `admin_email`, `accion`.
- `ORDER BY creado_en DESC LIMIT 100` fijo — sin paginación (catálogo
  pequeño, YAGNI; se puede agregar después si crece el volumen).
- Respuesta: array de `{id, accion, planta_id, planta_nombre, admin_email, creado_en}`.

## 4. Frontend

`api.js`:
- `getBitacora(filtros)` — `GET /admin/bitacora.php` con query string,
  mismo patrón que `listUsers()`.

`admin.html`:
- Modal nuevo `bitacoraModal` ("Auditoría"), mismo markup/estilo que
  `usersModal`. Tabla: Acción | Planta | Usuario | Fecha.
- Filtros simples arriba de la tabla: `<select>` de acción, `<input>` de
  búsqueda por planta.
- Botón de acceso `owner-only` en sidebar (junto a "Perfiles") y en el
  dropdown de cuenta — reutiliza la clase `.owner-only` ya gateada por
  `admin-nav.js`, sin tocar ese archivo.
- Dentro del modal de editar planta (`admin-form.js` / template), sección
  "Historial" — solo visible si la planta ya existe (`id` presente) **y**
  el usuario es Dueño: últimas 10 entradas de esa planta + link "Ver
  bitácora completa" que abre `bitacoraModal` pre-filtrado por `planta_id`.

`js/admin/admin-bitacora.js` (nuevo):
- `openBitacoraModal()`, `closeBitacoraModal()`, `loadBitacora(filtros)`,
  render de tabla — espejo estructural de `admin-users.js`.
- Función exportada `loadPlantHistory(plantaId)` para el mini-historial del
  modal de editar planta.

`admin-events.js`:
- Cablear `data-action="open-bitacora-modal"` y cambios de filtro.

## Archivos

**Nuevos**
- `sql/migrations/005_bitacora.sql`
- `api/admin/bitacora.php`
- `js/admin/admin-bitacora.js`

**Modificados**
- `api/admin/plantas.php` — capturar `$caller`, insertar en `bitacora` tras
  cada operación exitosa.
- `api.js` — `getBitacora(filtros)`.
- `admin.html` — modal "Auditoría", botones de acceso `owner-only`, sección
  "Historial" en modal de editar planta.
- `js/admin/admin-form.js` — cargar/mostrar mini-historial al abrir edición.
- `js/admin/admin-events.js` — cablear apertura de modal y filtros.

## Seguridad / no romper nada

- `require_owner()` en el endpoint de lectura — mismo guard que `usuarios.php`.
- Logging es best-effort: nunca bloquea ni revierte una operación CRUD real.
- Sin `FOREIGN KEY`, así que borrar un admin o una planta no falla ni deja
  huérfanos bloqueantes — la bitácora conserva el snapshot.
- No se expone `password_hash` ni ningún dato sensible en la respuesta.

## Pruebas

Checklist manual (PHP local + MySQL):
1. Aplicar migración `005_bitacora.sql`.
2. Crear planta como Editor → fila en bitácora con `accion='crear'`,
   `admin_email` del Editor.
3. Editar esa planta como Dueño → nueva fila `accion='editar'`.
4. Borrar la planta → fila `accion='borrar'` con `planta_nombre` correcto
   (no vacío) aunque la planta ya no exista en `plantas`.
5. Login como Editor → no ve botón "Auditoría" ni sección "Historial";
   `GET bitacora.php` con su token devuelve 403.
6. Login como Dueño → modal "Auditoría" lista las 4 acciones de arriba,
   filtros por acción/planta funcionan.
7. Mini-historial en modal de editar planta muestra las entradas de esa
   planta específica.
8. Borrar un perfil Editor que tiene entradas en bitácora → las entradas
   siguen visibles (con su `admin_email` snapshot) sin error.

## Deploy a Hostinger (orden)

1. **MySQL** (phpMyAdmin): ejecutar `sql/migrations/005_bitacora.sql`.
2. **PHP**: subir `api/admin/plantas.php` (modificado), `api/admin/bitacora.php` (nuevo).
3. **Frontend**: subir `admin.html`, `api.js`, `js/admin/admin-form.js`,
   `js/admin/admin-events.js`, `js/admin/admin-bitacora.js` (nuevo).
