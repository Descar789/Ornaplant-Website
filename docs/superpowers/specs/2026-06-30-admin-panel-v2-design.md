# Diseño: Panel Admin v2 — perfiles, permisos, responsive, edición fácil

Fecha: 2026-06-30
Estado: aprobado (diseño)

## Objetivo

Pulir el panel admin de ORNAPLANT (`admin.html` + `js/admin/*` + `api/admin/*`):
panel responsive con menús desplegables, creación de perfiles con permisos
(correo + contraseña), edición más fácil de plantas ya subidas e interfaz más
intuitiva. Mantener los menús de opciones futuras (Pedidos / Clientes /
Configuración) presentes pero inactivos. No eliminar nada que funcione.

## Decisiones (confirmadas con el usuario)

- Backend completo ahora (migración MySQL + endpoints PHP en Hostinger).
- Modelo de permisos: **roles simples** — Dueño (`owner`) vs Editor (`editor`).
- Menú desplegable: **dos** — hamburguesa móvil + menú de cuenta (arriba derecha).
- Edición más fácil: **ambas** — edición en línea (campos clave) + modal mejorado.

## 1. Roles y permisos (backend)

### Migración SQL
`sql/migrations/004_admins_roles.sql`:
- `ALTER TABLE admins ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'editor'`.
- `ADD COLUMN nombre VARCHAR(150) NOT NULL DEFAULT ''`.
- `ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1`.
- `UPDATE admins SET role = 'owner'` para todos los admins existentes
  (no pierden acceso; se asume que los actuales son dueños).

### Roles
- **Dueño (`owner`)**: todo el inventario + crear/listar/borrar perfiles.
- **Editor (`editor`)**: solo inventario. No ve ni puede tocar gestión de usuarios.

### Endpoint de autenticación
`api/admin/auth.php`:
- Selecciona también `role`, `nombre`, `activo`. Rechaza si `activo = 0`.
- El JWT lleva el `role` **real** de la DB (hoy está fijo en `'admin'`).
- Respuesta incluye `role` y `nombre` además de `email`.

### JWT helpers
`api/jwt.php`:
- `require_admin()`: acepta `role ∈ {owner, editor}` (antes exigía `'admin'`).
- Nuevo `require_owner()`: exige `role === 'owner'`; si no, 403.

### Endpoint de usuarios
`api/admin/usuarios.php` (nuevo), todo bajo `require_owner()`:
- `GET`: lista `{id, nombre, email, role, activo, creado_en}` (sin hash).
- `POST`: crea perfil — valida `email` (formato + único), `password` (≥ 8),
  `role ∈ {owner, editor}`, `nombre`. Hash con `password_hash(..., PASSWORD_BCRYPT, ['cost'=>12])`.
- `DELETE ?id=`: borra perfil. Bloqueos: no puedes borrarte a ti mismo
  (compara con `sub` del JWT); no puedes borrar al **último** `owner` activo.
- Errores con campo (`field`) para que el frontend resalte el input culpable.

## 2. Auth frontend

`api.js`:
- `adminLogin` guarda `ornaplant_role` y `ornaplant_nombre` en sessionStorage.
- Nuevas funciones: `getAdminRole()`, `listUsers()`, `createUser(data)`,
  `deleteUser(id)`.

`js/admin/admin-auth.js`:
- Exponer `getRole()`. El gating de UI usa el rol, pero **el servidor es la
  autoridad** (cada endpoint protegido revalida con `require_owner`).

## 3. Responsive + menús desplegables

`js/admin/admin-nav.js` (nuevo) + markup en `admin.html`:

- **Hamburguesa móvil (<768px)**: barra superior con botón hamburguesa que abre
  la sidebar existente como *drawer* deslizante desde la izquierda + overlay
  oscuro. Cerrar con overlay, Escape o seleccionar item. Desktop sin cambios.
  Reutiliza el markup de navegación de la sidebar (sin duplicar items).
- **Menú de cuenta (arriba derecha)**: botón con correo/insignia → dropdown:
  correo + insignia de rol, "Gestionar perfiles" (solo Dueño), "Ver sitio",
  "Cerrar sesión". Reemplaza la fila de enlaces suelta del `content-header`.
  Cierra al hacer click fuera o Escape. Accesible (`aria-expanded`, foco).
- Items futuros (Pedidos / Clientes / Configuración) **siguen presentes y
  deshabilitados** (opacity 0.4, `disabled`).

## 4. Edición más fácil de plantas

### En línea (sin abrir modal)
`js/admin/admin-ui-list.js` + plantilla de fila en `admin.html` + `admin-events.js`:
- Agregar un `<select>` de **sucursal** en cada fila (junto al de disponibilidad
  ya existente), con guardado optimista + rollback en error (mismo patrón que
  disponibilidad). Campos clave editables sin abrir el modal.

### Modal mejorado
`admin.html` (markup) + `admin-form.js`:
- Mismos campos, agrupados en secciones con subtítulos: **Identidad**,
  **Clasificación**, **Cuidados**, **Logística**, **Imagen**.
- Enter guarda (excepto en textarea); foco inicial en Nombre (ya existe).
- Nada se elimina; SKU, imagen, validaciones y flujo actuales se conservan.

## 5. Gestión de perfiles (solo Dueño)

`js/admin/admin-users.js` (nuevo) + modal en `admin.html`:
- Abierto desde el menú de cuenta → "Gestionar perfiles".
- Lista de usuarios (nombre, correo, insignia de rol) con botón borrar
  (confirmación de 2 clics, mismo patrón que borrar planta).
- Formulario "Crear perfil": nombre, correo, contraseña, rol (Dueño/Editor).
- Editor: la opción no aparece y el endpoint la rechaza con 403.

## 6. Pulido UI/UX

Aplicar skill `ui-ux-pro-max` durante implementación:
- Estados de foco consistentes, insignias de rol, animación del drawer,
  toasts, consistencia de espaciado y tipografía con la paleta existente
  (verde g950–g50, magenta m700) y fuentes Plus Jakarta Sans / Manrope.

## Archivos

**Nuevos**
- `sql/migrations/004_admins_roles.sql`
- `api/admin/usuarios.php`
- `js/admin/admin-nav.js`
- `js/admin/admin-users.js`

**Modificados**
- `admin.html` — barra móvil + drawer, menú de cuenta, modal de perfiles,
  secciones del modal de planta, select de sucursal en plantilla de fila.
- `api/admin/auth.php` — rol real en JWT, chequeo `activo`.
- `api/jwt.php` — `require_admin` acepta owner/editor, nuevo `require_owner`.
- `api.js` — almacenamiento de rol, CRUD de usuarios, `getAdminRole`.
- `js/admin/admin-auth.js` — exponer rol.
- `js/admin/admin-events.js` — cablear nav/dropdown/usuarios/sucursal en línea.
- `js/admin/admin-ui-list.js` — render del select de sucursal.
- `js/admin/main.js` — gating de UI de Dueño.

## Seguridad / no romper nada

- Admins actuales pasan a `owner` en la migración → conservan acceso total.
- `require_admin()` sigue válido para inventario (owner + editor).
- Cada endpoint de usuarios revalida `require_owner` en el servidor; el gating
  de UI por rol es solo cosmético.
- Items de opciones futuras intactos.
- Validación de contraseña mínima 8; bloqueo de auto-borrado y último-dueño.

## Pruebas

Sitio estático sin framework de test. Checklist manual (PHP local + MySQL):
1. Aplicar migración; admin existente queda como Dueño y entra.
2. Login como Dueño: ve "Gestionar perfiles".
3. Crear perfil Editor; login como Editor: no ve gestión de perfiles;
   `GET/POST/DELETE usuarios.php` devuelve 403.
4. Intentar borrarte a ti mismo / al último Dueño → bloqueado.
5. Drawer móvil abre/cierra (overlay, Escape, selección).
6. Menú de cuenta abre/cierra.
7. Edición en línea de sucursal guarda y revierte en error.
8. Modal de planta crea/edita igual que antes.

## Deploy a Hostinger (orden)

1. **MySQL** (phpMyAdmin): ejecutar `sql/migrations/004_admins_roles.sql`.
2. **PHP**: subir `api/jwt.php`, `api/admin/auth.php`, `api/admin/usuarios.php`.
3. **Frontend**: subir `admin.html`, `api.js`, y `js/admin/*.js`
   (modificados + nuevos `admin-nav.js`, `admin-users.js`).
