# Aporte de Codex - Refactor del Panel Admin

Este aporte complementa el plan compartido en:

`ai-collaboration/refactor-admin-panel.md`

## Observaciones principales

1. Mover seguridad XSS a Fase 1.

   El panel actual usa `innerHTML` para renderizar datos editables de plantas.
   Antes de ampliar UX, el render debe usar `textContent` o escape completo de
   campos dinamicos.

2. Mantener `api.js` como cliente HTTP compartido.

   No conviene duplicar fetches en un `admin-api.js` si `api.js` ya tiene esa
   responsabilidad. Si se necesita una capa admin, usar un servicio fino encima
   de `api.js`.

3. Agregar un entrypoint claro.

   `admin.html` deberia importar solo `js/admin/main.js`. Ese archivo inicializa
   auth, estado, eventos y primer render.

4. Multi-imagen no es solo frontend.

   `api/admin/upload.php` guarda como `SKU.ext` y borra variantes previas del
   mismo SKU. Para varias imagenes debe generar nombres unicos y no eliminar
   archivos anteriores durante upload.

5. SKU unico debe protegerse en backend.

   La validacion inline con `plantList` es util, pero insuficiente. Si el SKU es
   unico, debe existir validacion fuerte o constraint en MySQL/PHP.

6. Logs de auditoria deben vivir en PHP.

   Si se implementan logs, deben registrarse dentro de los endpoints usando el
   resultado de `require_admin()`, no desde el frontend.

7. Soft delete impacta el sitio publico.

   Agregar `deleted_at` no basta. Tambien hay que filtrar en `api/plantas.php`,
   `catalogo.php`, `planta.php`, `sitemap.php` y el listado admin.

## Criterios minimos para aprobar Fase 1

- No queda `onclick`, `onchange` ni `onkeydown` en `admin.html`.
- No quedan funciones admin expuestas en `window.*`.
- Login, logout, crear, editar, borrar, buscar, paginar y cambiar disponibilidad
  funcionan igual que antes.
- Disponibilidad hace rollback si falla el servidor.
- Render del listado no inyecta HTML sin escapar desde datos editables.
- README describe PHP/MySQL/JWT/uploads locales, no Firebase/Cloudinary/tester.
