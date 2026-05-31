# Admin Panel Refactor — Diseño

**Fecha:** 2026-05-31  
**Alcance:** 2 fases · 3 módulos JS · sin multi-imagen · sin soft delete / audit logs

## Contexto

`admin.html` es un monolito de 740 líneas con HTML, CSS y JS mezclados. Tiene 6 bugs activos, inline handlers, globals en `window.*`, XSS potencial en `innerHTML`, y un hack frágil de POST→PUT en `api.js`. El plan de Codex en `ai-collaboration/refactor-admin-panel.md` es sólido en intención pero sobreingeniería en escala (7 módulos) y fuerza trabajo duplicado (XSS en dos fases).

Este diseño corrige esos problemas.

## Bugs activos (todos resueltos en Fase 1)

| Ubicación | Bug |
|-----------|-----|
| `isAdminLogged()` | Solo checa existencia del token, no verifica `exp` — muestra panel brevemente antes del 401 |
| `api.js:66` | `savePlant()` hace retry POST→PUT si el error contiene `'duplicad'` — string matching frágil |
| `accessDenied` div | Pantalla nunca se muestra — dead code desde migración de Firebase |
| `adminAvatar` img | `src=""` nunca se rellena — request vacío al servidor en cada load |
| `ENUMS cuidado` | PHP tiene `'intermedio'` Y `'intermedia'` — registros viejos en DB con valor potencialmente inválido |
| ID generation | Frontend usa `normalize('NFD').replace(...)`, PHP usa `slugify()` — divergen con acentos |

## Arquitectura de módulos

```
admin.html          ← HTML + CSS únicamente
js/admin/
  auth.js           ← login, logout, verificación JWT+exp, getEmail()
  panel.js          ← estado, render, CRUD, paginación, búsqueda, filtros
  toast.js          ← notificaciones (success/error/info), sin dependencias
api.js              ← cliente HTTP compartido, sin cambios de interfaz pública excepto:
                       createPlant(id?, data) → POST
                       updatePlant(id, data)  → PUT  (ya existe)
                       eliminar savePlant()
```

**Reglas de frontera:**
- `admin.html` importa solo `js/admin/auth.js`
- `auth.js` importa `panel.js` una vez que auth pasa; nunca al revés
- `panel.js` usa `api.js` directamente — sin service layer intermedio
- `toast.js` no importa nada
- Cero `window.*`, cero `onclick`/`onchange`/`onkeydown` inline

## Fase 1 — Base Segura

Sin cambios visibles para el usuario. Solo correctitud interna.

### 1. Modularizar JS

Crear `js/admin/` con los 3 módulos. `admin.html` queda con solo `<script type="module" src="js/admin/auth.js">`.

Responsabilidades:

**`auth.js`**
- `initAuth()` — verifica token + exp, decide pantalla inicial
- `signIn(email, password)` — llama `api.adminLogin()`, inicia panel
- `signOut()` — llama `api.adminLogout()`, muestra login
- `isExpired()` — decodifica JWT, compara `exp` con `Date.now()/1000`

**`panel.js`**
- Estado: `plantList`, `globalVisits`, `searchTerm`, `currentPage`, `editingId`, `pendingImageUrl`
- `initPanel()` — `Promise.all([getPlants, getGlobalVisits])`
- `renderStats()`, `renderList()`, `renderPagination()`
- `updateDisp(id, val)` — con rollback
- `openModal(id?)`, `closeModal()`, `savePlantUI()`
- `deletePlantUI(id)` — con confirmación 2-click
- Todos los event listeners registrados aquí

**`toast.js`**
- `showToast(message, type)` — `type: 'success' | 'error' | 'info'`
- Inyecta DOM propio, auto-dismiss 3s, `role="alert"`
- Sin dependencias externas

### 2. Quitar inline handlers

Todos los `onclick`, `onchange`, `onkeydown` eliminados de `admin.html` y de template literals.  
Reemplazar con `addEventListener` y delegación desde `panel.js`:

```js
document.addEventListener('change', e => {
  const sel = e.target.closest('.disp-select');
  if (sel) updateDisp(sel.closest('[data-id]').dataset.id, sel.value);
});
```

### 3. XSS fix + DOM construction

`createPlantRow(plant)` devuelve `HTMLElement`. Todos los campos del usuario via `textContent`:

```js
function createPlantRow(p) {
  const row = document.createElement('div');
  row.className = 'plant-row';
  row.dataset.id = p.id;
  const nameEl = document.createElement('div');
  nameEl.textContent = p.nombre;          // textContent, no innerHTML
  // ... resto de campos igual
  return row;
}
```

Solo strings estáticos (iconos, clases CSS) pueden ir en `innerHTML`.

### 4. JWT exp check

```js
function isExpired() {
  const token = sessionStorage.getItem('ornaplant_token');
  if (!token) return true;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64));
    return Date.now() / 1000 >= payload.exp;
  } catch { return true; }
}
```

`initAuth()` usa `isExpired()` antes de mostrar el panel.

### 5. api.js: createPlant / updatePlant explícitos

```js
// Eliminar savePlant() completo

export async function createPlant(data) {
  return apiFetch('/admin/plantas.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),   // sin campo 'id' — server lo genera
  });
}
// updatePlant(id, data) ya existe — sin cambios
```

`panel.js` llama `createPlant(data)` para nuevo (sin `id`), `updatePlant(id, data)` para edición. Server genera ID via `slugify(nombre)` o SKU, devuelve `{id, ok}`. **`panel.js` se escribe sin ID generation client-side desde el inicio — no hay nada que remover en Fase 2.**

### 6. Rollback de disponibilidad

```js
async function updateDisp(id, val) {
  const plant = plantList.find(p => p.id === id);
  const prev = plant.disponibilidad;
  plant.disponibilidad = val;
  renderStats();
  try {
    await updatePlant(id, { disponibilidad: val });
  } catch {
    plant.disponibilidad = prev;
    renderStats();
    renderList();
    showToast('Error al actualizar disponibilidad', 'error');
  }
}
```

### 7. Eliminar dead code

- Remover div `#accessDenied` y toda lógica asociada
- Remover img `#adminAvatar` (nunca se rellena)
- Flujo auth resultante: `authLoading` → (logged? → `adminPanel` : `loginScreen`)

### 8. Migración DB — ENUMS cuidado

```sql
-- sql/migrations/001_fix_cuidado_enum.sql
UPDATE plantas SET cuidado = 'intermedio' WHERE cuidado = 'intermedia';
```

PHP `api/admin/plantas.php`: quitar `'intermedia'` del array `ENUMS['cuidado']`.

### 9. README

Eliminar referencias a Firebase, Firestore, Cloudinary, `?tester=true`.  
Documentar stack real: PHP REST API, MySQL, JWT HS256 propio, uploads locales en `/uploads/`.

### Criterios de aceptación — Fase 1

- [ ] Cero `onclick`, `onchange`, `onkeydown` en `admin.html`
- [ ] Cero `window.*` para funciones del admin
- [ ] Login, logout, crear, editar, borrar, buscar, paginar, cambiar disponibilidad — todos funcionan
- [ ] Token expirado redirige al login sin flash del panel
- [ ] Cambio de disponibilidad revierte si falla el server, muestra toast de error
- [ ] Listado renderizado con DOM construction (sin user data en innerHTML)
- [ ] `accessDenied` y `adminAvatar` removidos
- [ ] `cuidado` normalizado en DB y PHP
- [ ] `savePlant()` eliminado de `api.js`; `createPlant` + `updatePlant` funcionan
- [ ] README refleja stack actual

## Fase 2 — UX del Catálogo

Visible para el admin. Prerequisito: Fase 1 completa.

### 1. Toast system reemplaza alert()/confirm()

`toast.js` ya existente de Fase 1. Reemplazar:
- Errores de guardado → `showToast(msg, 'error')`
- Éxito → `showToast(msg, 'success')`
- Confirmación de borrado → confirmación 2-click (ver punto 3)

### 2. Validación inline

Errores aparecen debajo del campo, no en alert. Validar en submit y on-blur:

- `nombre` → requerido, no vacío
- `descripcion` → requerido, no vacío  
- `sku` → si existe: solo alfanumérico, max 10 chars, único vs `plantList`

Estructura HTML por campo:
```html
<input id="f-nombre" class="form-input" ...>
<span id="f-nombre-err" class="field-error" style="display:none"></span>
```

### 3. Confirmación de borrado sin confirm()

Primer click en botón delete → cambia a estado "¿Confirmar?" (fondo rojo, texto diferente).  
Segundo click → ejecuta delete.  
Click en cualquier otro lugar → reset al estado normal.

Implementación: `data-confirm-pending="true"` en el botón, listener en document para reset.

### 4. Filtros + orden

Estado adicional en `panel.js`:
```js
let filterCat  = '';   // '' = todas
let filterDisp = '';   // '' = todas
let filterSuc  = '';   // '' = todas
let sortField  = 'nombre';  // 'nombre' | 'sku' | 'vistas'
let sortDir    = 'asc';
```

UI: barra de filtros entre el título "Plantas" y la barra de búsqueda. 3 selects compactos + 1 sort select.

`getFilteredPlants()` aplica: filtros → búsqueda texto → sort.  
Resetear `currentPage = 1` en cualquier cambio de filtro/sort.

### 5. SKU UNIQUE en MySQL

```sql
-- sql/migrations/002_sku_unique.sql
ALTER TABLE plantas ADD UNIQUE KEY uk_sku (sku);
```

PHP `api/admin/plantas.php`: en catch PDOException, detectar error 1062 en campo `sku`:
```php
if (($e->errorInfo[1] ?? 0) === 1062 && str_contains($e->getMessage(), 'uk_sku')) {
    json_error('SKU duplicado', 409, ['field' => 'sku']);
}
```

Frontend: si response es 409 con `field: 'sku'` → mostrar error bajo campo SKU.

### Criterios de aceptación — Fase 2

- [ ] Cero `alert()` o `confirm()` en flujos normales del panel
- [ ] Errores de campos requeridos aparecen debajo del campo
- [ ] Error de SKU duplicado aparece debajo del campo SKU
- [ ] Filtros por categoría, sucursal y disponibilidad funcionan con búsqueda y paginación
- [ ] Sort por nombre, SKU y vistas funciona
- [ ] SKU único enforced en DB; crear dos plantas con mismo SKU muestra error claro
- [ ] Confirmar borrado requiere 2 clicks; click afuera cancela

## Flujo de datos completo

```
Carga inicial:
  admin.html → auth.js initAuth()
    → isExpired()? → showLoginScreen()
    → no expirado  → panel.js initPanel()

initPanel():
  Promise.all([getPlants(), getGlobalVisits()])
  → plantList, globalVisits
  → renderStats() + renderList()

Crear planta:
  openModal(null) → usuario llena form
  → savePlantUI() → validateForm() → si errores: mostrar inline, return
  → api.createPlant(data) → {id, ok}
  → plantList.push({id, ...data})
  → closeModal() → renderStats() → renderList()
  → showToast('Planta guardada', 'success')

Editar planta:
  openModal(id) → form pre-rellenado
  → savePlantUI() → validateForm()
  → api.updatePlant(id, data) → {ok}
  → plantList[idx] = {...prev, ...data}
  → closeModal() → renderStats() → renderList()
  → showToast('Planta actualizada', 'success')

Borrar planta:
  click delete → estado confirm-pending
  click delete de nuevo → api.deletePlant(id)
  → plantList.filter(p => p.id !== id)
  → renderStats() → renderList()
  → showToast('Planta eliminada', 'success')

Disponibilidad (optimistic):
  select change → updateDisp(id, val)
  → guardar prev, actualizar plantList + CSS
  → renderStats()
  → api.updatePlant(id, {disponibilidad: val})
  → si falla: plantList[i].disponibilidad = prev
              renderStats() + renderList()
              showToast('Error al actualizar', 'error')
```

## Fuera de alcance

- Multi-imagen por planta
- Soft delete / papelera (`deleted_at`)
- Audit logs (`admin_logs` table)
- Dashboard analytics avanzado
- Gestión de múltiples usuarios admin desde el panel

## Archivos a crear / modificar

### Nuevos
- `js/admin/auth.js`
- `js/admin/panel.js`
- `js/admin/toast.js`
- `sql/migrations/001_fix_cuidado_enum.sql`
- `sql/migrations/002_sku_unique.sql`

### Modificados
- `admin.html` — quitar todo JS, quitar dead code, importar `js/admin/auth.js`
- `api.js` — eliminar `savePlant()`, agregar `createPlant()`
- `api/admin/plantas.php` — fix ENUMS, fix 409 SKU con field
- `README.md` — actualizar stack

### Sin cambios
- `api/admin/auth.php`
- `api/admin/upload.php`
- `api/jwt.php`
- `api/db.php`
- `api/config.php`
- `config.js`
- Todo el resto del sitio público
