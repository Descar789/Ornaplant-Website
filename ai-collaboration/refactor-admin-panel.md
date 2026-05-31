# Plan de Refactorizacion y Mejora del Panel Admin

Este documento es el plan maestro compartido para refactorizar `admin.html` y
mejorar la UX del catalogo, manteniendo el backend actual PHP/MySQL y la UI
general existente.

Actualizacion tras feedback de Claude: el plan debe ser mas compacto. El primer
objetivo no es crear muchas capas, sino dejar el CRUD del catalogo seguro,
predecible y facil de mantener.

Ejecutar por fases. No avanzar a una fase posterior si la anterior no cumple sus
criterios de aceptacion.

## Fase 1: Base Limpia y Correcciones Criticas

Objetivo: sacar la logica JS de `admin.html`, eliminar antipatrons, corregir
riesgos reales del flujo actual y preservar la funcionalidad visible.

### 1. Modularizacion compacta

Crear `js/admin/` con 3 modulos de trabajo mas un entrypoint:

- `main.js`: entrypoint unico importado por `admin.html`; inicializa auth,
  estado, eventos y primer render.
- `state.js`: estado compartido del panel (`plantList`, `globalVisits`,
  busqueda, pagina actual, `editingId`, imagen pendiente).
- `ui.js`: render seguro, modal, preview de imagen, estados de carga y toasts.
- `actions.js`: auth, eventos, CRUD, disponibilidad con rollback y llamadas a
  `api.js`.

Mantener `api.js` como unica capa HTTP. No crear `admin-api.js` ni
`admin-service.js` en esta fase.

### 2. Eliminar antipatrons del HTML

- Quitar todos los handlers inline: `onclick`, `onchange`, `onkeydown`.
- Quitar exposiciones `window.*` usadas por el admin.
- Registrar eventos con `addEventListener` o delegacion desde `actions.js`.
- `admin.html` debe quedar como estructura HTML + estilos + import de
  `js/admin/main.js`.

### 3. Render seguro una sola vez

El listado actual usa `innerHTML` con datos editables como nombre, categoria,
SKU y nombre cientifico. Corregirlo directamente en el nuevo `ui.js`:

- Construir filas de plantas con `document.createElement`.
- Asignar texto con `textContent`.
- Revisar atributos dinamicos como `aria-label`, `src` y `data-id`.
- Evitar el camino de "escapar templates ahora y reescribir DOM despues".

### 4. Separar crear y editar

El flujo actual usa `savePlant()` con `POST` y, si detecta texto de duplicado,
reintenta con `PUT`. Eso es fragil.

- Agregar funciones explicitas en `api.js` si hace falta:
  - `createPlant(data)`
  - `updatePlant(id, data)` ya existe.
- Al crear, el frontend no debe inventar IDs con `normalize('NFD')`.
- El backend debe generar o devolver el `id` definitivo.
- Al editar, usar siempre `PUT` con el `id` existente.

### 5. Auth y codigo muerto

- `isAdminLogged()` no debe aceptar cualquier token presente; debe validar el
  `exp` del JWT o limpiar sesion si esta expirado.
- Eliminar o justificar `accessDenied`, que quedo como resto de la etapa
  Firebase y no se usa con el login actual.
- Eliminar `adminAvatar` si no se llena en ninguna parte.

### 6. Normalizar `cuidado`

Actualmente conviven `intermedio` e `intermedia`.

- Usar `intermedio` como valor canonico en HTML, JS y datos nuevos.
- Mantener compatibilidad temporal en PHP aceptando ambos si hay datos viejos.
- Documentar la decision en el plan o README tecnico.

### 7. Disponibilidad optimista con rollback

Al cambiar disponibilidad desde la lista:

- Guardar el valor anterior.
- Actualizar UI, clase CSS y estadisticas inmediatamente.
- Guardar en backend en segundo plano.
- Si falla, restaurar valor anterior en estado, select y estadisticas.
- Mostrar toast de error; no usar `alert()`.

### 8. Limpieza del README

Actualizar `README.md` para reflejar el stack actual:

- PHP + MySQL.
- JWT propio.
- Subida local de imagenes.
- Eliminar referencias obsoletas a Firebase, Firestore, Cloudinary y
  `admin.html?tester=true`.

### Criterios de aceptacion Fase 1

- No queda ningun `onclick`, `onchange` ni `onkeydown` en `admin.html`.
- No queda ningun `window.*` para funciones del admin.
- `admin.html` importa solo `js/admin/main.js` para el panel.
- Login, logout, buscar, paginar, crear, editar, borrar y cambiar disponibilidad
  funcionan igual que antes.
- Crear y editar son rutas explicitas; no hay retry `POST` -> `PUT` basado en
  texto como `includes('duplicad')`.
- El backend es dueno del ID al crear plantas.
- `isAdminLogged()` considera expiracion del JWT.
- El render del listado no inyecta HTML sin escapar desde datos editables.
- El cambio de disponibilidad revierte correctamente si falla el servidor.
- `cuidado` usa `intermedio` como valor canonico.
- `README.md` describe el stack actual.

Pausar aqui y pedir revision antes de continuar.

## Fase 2: UX Fuerte del Catalogo

Objetivo: mejorar el uso diario del gestor de catalogo despues de que el CRUD
base este limpio.

### 1. Validaciones inline y feedback

- Extender los toasts para exito, error y validacion.
- Reemplazar `alert()` y `confirm()` restantes por toasts/dialogos propios.
- Validar SKU mientras se escribe.
- Mostrar errores debajo del campo correspondiente.
- Validar campos requeridos antes de guardar.

Nota: la validacion de SKU en frontend mejora UX, pero no garantiza unicidad.
Debe existir proteccion en backend/base de datos si SKU debe ser unico.

### 2. SKU unico en backend

Definir la regla de negocio:

- Si `sku` debe ser unico, agregar constraint o validacion fuerte en MySQL/PHP.
- Actualizar `sql/indices.sql` y crear migracion si aplica.
- Manejar el error de duplicado con respuesta clara para el formulario.

### 3. Filtros y ordenamiento

- Filtros por categoria, sucursal y disponibilidad.
- Orden por nombre, SKU, fecha de creacion y vistas.
- Mantener busqueda actual por nombre, nombre cientifico, SKU y etiquetas.
- Reiniciar pagina actual al cambiar filtros u orden.

### Criterios de aceptacion Fase 2

- Los errores aparecen cerca del campo afectado.
- No quedan `alert()` en flujos normales del panel.
- Filtros, busqueda, orden y paginacion funcionan juntos.
- Los errores de SKU duplicado son detectados por UI y backend.

Pausar aqui y pedir revision antes de continuar.

## Fase 3: Multi-imagen Real

No planificar la implementacion detallada hasta resolver primero la politica de
archivos. Esta decision debe tomarse antes de tocar `upload.php`.

### Decision previa requerida

Responder:

- Si eliminar una miniatura solo la quita de la planta o tambien borra el archivo
  fisico.
- Como limpiar archivos huerfanos si se sube una imagen y luego se cancela el
  formulario.
- Si se permite subir imagenes antes de que la planta exista.
- Si el nombre de archivo sera `SKU-uniqid.ext`, `SKU-timestamp.ext` u otro
  formato.

### Alcance previsto despues de decidir

- Backend: `api/admin/upload.php` no debe sobrescribir `SKU.ext` ni borrar
  variantes previas.
- Frontend: galeria de miniaturas, subir varias, eliminar del array, elegir o
  reordenar imagen principal.
- Catalogo publico: seguir usando `imagenes[0]` como imagen principal.

### Criterios de aceptacion Fase 3

- Una planta puede guardar varias imagenes en `imagenes`.
- Subir una imagen nueva no borra imagenes anteriores del mismo SKU.
- El catalogo publico sigue usando la imagen principal correctamente.
- Editar una planta existente conserva, reordena y elimina imagenes segun la
  politica definida.

Pausar aqui y pedir revision antes de continuar.

## Futuro Opcional: Panel Completo

No comprometer esta fase como parte del refactor inicial. Implementar solo si el
panel ya esta estable y existe necesidad operativa real.

Opciones:

- Plantas mas vistas usando el campo `vistas`.
- Plantas con datos incompletos: sin imagen, sin SKU o sin descripcion.
- Auditoria con tabla `admin_logs`.
- Soft delete / papelera con columna `deleted_at`.

Consideraciones:

- Logs deben registrarse en PHP usando el resultado de `require_admin()`, no
  depender del frontend.
- Soft delete afecta `api/plantas.php`, `catalogo.php`, `planta.php`,
  `sitemap.php`, listado admin y una vista de papelera.
- Para un panel con 1-2 admins, logs y papelera pueden esperar hasta que haya
  dolor operativo real.
