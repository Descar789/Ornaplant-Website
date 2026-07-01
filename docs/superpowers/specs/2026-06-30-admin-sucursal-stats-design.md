# Diseño: quitar campo "sucursal" del panel admin + stat "Incorrectas"

Fecha: 2026-06-30
Estado: aprobado (diseño)

## Objetivo

Dos ajustes pequeños e independientes al panel admin, empaquetados en un
mismo spec por tamaño:

1. **Quitar sucursal** — el campo `sucursal` (`ambas | matriz | embarques`)
   ya no se usa como filtro público (`catalogo.php` no lo referencia; los
   enlaces "Sucursales" son a la página estática `sucursales.html`, sin
   relación con el dato). Se quita del panel admin (edición inline, modal,
   filtro de lista) y de la validación backend. **Soft-remove**: la columna
   y los datos existentes en MySQL quedan intactos — sin migración, sin
   pérdida de datos, reversible con solo re-agregar UI.
2. **Stat "Incorrectas"** — el dashboard admin junta `correcta` +
   `incorrecta` en una sola card "Revisadas". Se separa en dos cards
   precisas.

## Decisiones (confirmadas con el usuario)

- Sucursal: soft-remove (no hard-remove con migración SQL).
- Control de revisión (`revision-select`): **sin cambios** — ya es un
  `<select>` pill con el mismo patrón visual que `disp-select` (confirmado
  al revisar el código, no hacía falta cambiarlo).
- Stat "Revisadas" genérica se **reemplaza** por dos cards: "Correctas" e
  "Incorrectas" (no se agrega como card extra manteniendo la vieja).

## 1. Quitar sucursal

**`admin.html`**
- Borrar bloque CSS `.suc-select` (líneas ~367-374).
- Borrar `<select id="filterSuc">` del toolbar de filtros (~617-621).
- Borrar campo `f-suc` del modal de edición (~731-732).
- Borrar `<select class="suc-select">` del `<template>` de fila de lista
  (~915-919).

**`js/admin/admin-state.js`**
- Quitar `filterSuc`, `getFilterSuc()`, `setFilterSuc()`.
- Quitar el reset de `filterSuc` dentro de `clearFilters()`.

**`js/admin/admin-ui-list.js`**
- Quitar import de `getFilterSuc`.
- Quitar el filtro `if (suc && p.sucursal !== suc) return false;`.
- Quitar `getFilterSuc()` del cálculo de `hasFilters`.
- Quitar el bloque que puebla `.suc-select` por fila (`sucSel`, líneas
  ~107-110).

**`js/admin/admin-form.js`**
- Quitar `setVal('f-suc', ...)` en ambos flujos (editar y nueva planta).
- Quitar `sucursal: document.getElementById('f-suc').value` del payload
  que arma el modal.

**`js/admin/admin-events.js`**
- Quitar el handler inline de `.suc-select` (guardado optimista +
  rollback, líneas ~65-84).
- Quitar `setFilterSuc` del import.
- Quitar el listener `if (e.target.id === 'filterSuc') { ... }`.

**`api/admin/plantas.php`**
- Quitar `'sucursal' => [...]` de `ENUMS`.
- Quitar `'sucursal'` de ambos arrays `$allowed` (build_payload y el
  foreach de validación de enums).

**`CLAUDE.md`**
- Quitar la fila `sucursal: ambas | matriz | embarques` de la tabla de
  valores válidos.

No se toca: `api/plantas.php` (público — ya no expone `sucursal` como
filtro, esto no cambia), `sql/` (sin migración), `sucursales.html` (página
estática de ubicaciones, sin relación con el campo de la planta).

## 2. Stat "Incorrectas"

**`js/admin/admin-ui-stats.js`** — `renderStats()`:
- Reemplazar el contador combinado `revisadas` por dos contadores:
  `correctas` (`revision_estado === 'correcta'`) e `incorrectas`
  (`revision_estado === 'incorrecta'`).
- En el array `stats`, reemplazar la card `{ icon: 'task_alt', num:
  revisadas, label: 'Revisadas' }` por dos cards:
  `{ icon: 'task_alt', num: correctas, label: 'Correctas' }` y
  `{ icon: 'error', num: incorrectas, label: 'Incorrectas' }`.
- La card `Por revisar` (`porRevisar`) no cambia.

## Seguridad / no romper nada

- Quitar `sucursal` de `$allowed` en el backend admin significa que, si
  llegara `sucursal` en el body de un PUT/POST, se ignora silenciosamente
  (mismo comportamiento que cualquier campo no reconocido) — no rompe
  plantas existentes que ya tienen el valor guardado en DB.
- El dato histórico de `sucursal` por planta no se pierde ni se puede
  editar más desde el admin; si se necesita en el futuro, re-agregar la UI
  es un cambio aislado y reversible (la columna sigue ahí).
- `revision_estado` sigue sin exponerse en endpoints públicos — sin
  cambios en esa parte.

## Archivos

**Modificados**
- `admin.html`
- `js/admin/admin-state.js`
- `js/admin/admin-ui-list.js`
- `js/admin/admin-form.js`
- `js/admin/admin-events.js`
- `api/admin/plantas.php`
- `js/admin/admin-ui-stats.js`
- `CLAUDE.md`

**Sin cambios (verificado, no requieren tocarse)**
- `api/plantas.php`, `sql/`, `sucursales.html`, `catalogo.php`,
  `planta.php`

## Pruebas

Checklist manual (PHP local):
1. Panel admin: no aparece filtro "Sucursal" en el toolbar, ni columna en
   la fila de lista, ni campo en el modal de edición/creación.
2. Guardar una planta (editar o nueva) — funciona igual, sin error, sin
   campo sucursal en el payload enviado.
3. `PUT /admin/plantas.php` con `sucursal` en el body (simulado, ej. con
   curl) — se ignora, no hay error 500, la planta se actualiza igual con
   el resto de campos.
4. Dashboard admin: cards muestran "Por revisar", "Correctas",
   "Incorrectas" con conteos correctos (sumados deben dar el total de
   plantas).
5. Login Editor y Dueño: ambos ven el dashboard sin sucursal, con las 3
   cards de revisión.

## Deploy a Hostinger (orden)

1. **PHP**: subir `api/admin/plantas.php`.
2. **Frontend**: subir `admin.html`, `js/admin/admin-state.js`,
   `js/admin/admin-ui-list.js`, `js/admin/admin-form.js`,
   `js/admin/admin-events.js`, `js/admin/admin-ui-stats.js`.

Sin cambios en MySQL — no hay paso de migración en este deploy.
