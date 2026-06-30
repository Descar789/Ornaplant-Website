# Revisión interna de fotos + renombrar "bajo pedido" → "de temporada" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a purely-internal `revision_estado` field (no revisada/correcta/incorrecta) admins use to track field-review progress on 600+ plants, with zero effect on public disponibilidad/catalog ordering, plus rename the disponibilidad enum value `bajo pedido` → `de temporada` everywhere it appears.

**Architecture:** One new nullable-free VARCHAR column (`revision_estado`) and one JSON column (`imagenes_historial`, photo-replacement backup) added to `plantas` via migration. Admin CRUD endpoint gains the new field plus a owner-only bulk-reset action; public endpoints explicitly strip the internal field. Frontend gets a second, visually distinct select next to the existing disponibilidad control. No new tables, no triggers, no test framework (static PHP/JS site — verification is manual + `grep` structural checks, matching the existing project pattern).

**Tech Stack:** PHP 8 (no framework) + MySQL/MariaDB, vanilla JS ES Modules, no bundler.

**Spec:** `docs/superpowers/specs/2026-06-30-revision-disponibilidad-design.md`

---

### Task 1: Database migration

**Goal:** Add `revision_estado` and `imagenes_historial` columns to `plantas`, migrate existing `bajo pedido` rows to `de temporada`.

**Files:**
- Create: `sql/migrations/005_revision_estado.sql`

**Acceptance Criteria:**
- [ ] Migration adds both columns with correct types/defaults.
- [ ] Migration updates existing `disponibilidad = 'bajo pedido'` rows to `'de temporada'`.
- [ ] File follows the same header-comment style as `sql/migrations/004_admins_roles.sql`.

**Verify:** Manual review — no local MySQL instance available in this environment. Read the file back and confirm syntax is valid standard MySQL DDL (no engine-specific extensions beyond what `004_admins_roles.sql` already uses). Real verification happens after applying in Hostinger phpMyAdmin (see Task 13 / deploy order in spec).

**Steps:**

- [ ] **Step 1: Write the migration file**

```sql
-- sql/migrations/005_revision_estado.sql — estado de revisión interno
-- (auditoría de fotos) y renombrado del enum de disponibilidad
-- 'bajo pedido' → 'de temporada'.
--
-- Aplicar en Hostinger vía phpMyAdmin → pestaña SQL.
-- Sin impacto visible en catálogo público, salvo el rename del enum
-- (la disponibilidad sigue siendo 100% manual, como hoy).

ALTER TABLE plantas
  ADD COLUMN revision_estado    VARCHAR(20) NOT NULL DEFAULT 'no revisada' AFTER disponibilidad,
  ADD COLUMN imagenes_historial JSON        NULL                          AFTER imagenes;

UPDATE plantas SET disponibilidad = 'de temporada' WHERE disponibilidad = 'bajo pedido';
```

- [ ] **Step 2: Commit**

```bash
git add sql/migrations/005_revision_estado.sql
git commit -m "feat: migración revision_estado + imagenes_historial, renombrar bajo pedido"
```

---

### Task 2: Admin backend — `api/admin/plantas.php`

**Goal:** Accept/validate `revision_estado`, decode `imagenes_historial`, preserve replaced photos automatically, and add an owner-only bulk-reset action.

**Files:**
- Modify: `api/admin/plantas.php`

**Acceptance Criteria:**
- [ ] `ENUMS['disponibilidad']` no longer contains `'bajo pedido'`, contains `'de temporada'`.
- [ ] `ENUMS['revision_estado']` exists with `['no revisada', 'correcta', 'incorrecta']`.
- [ ] `revision_estado` is accepted and validated in `PUT`/`POST` payloads.
- [ ] `decode_planta()` returns `imagenes_historial` as a decoded array.
- [ ] On `PUT`, any URL present in the old `imagenes` array but absent from the new one is appended to `imagenes_historial` (no duplicates, no data loss).
- [ ] `PATCH ?action=reset_revision` sets `revision_estado = 'no revisada'` on every row, requires owner role, rejects non-owners with 403.

**Verify:** No PHP CLI available locally — verify by reading the diff against the criteria above line-by-line, and cross-check with `grep -n "revision_estado\|imagenes_historial\|bajo pedido" api/admin/plantas.php` to confirm the rename is complete and the new field is wired through every relevant block (ENUMS, $allowed, validation loop, decode_planta).

**Steps:**

- [ ] **Step 1: Update `ENUMS` (replace the existing const)**

```php
const ENUMS = [
    'categoria'       => ['interior', 'exterior', 'suculenta', 'ornamental', 'árbol', 'medicinal'],
    'luz'             => ['sol directo', 'luz indirecta', 'media sombra', 'sombra'],
    'riego'           => ['bajo', 'medio', 'alto'],
    'cuidado'         => ['fácil', 'intermedio', 'difícil'],
    'disponibilidad'  => ['disponible', 'de temporada', 'agotado'],
    'sucursal'        => ['ambas', 'matriz', 'embarques'],
    'mascotas'        => ['no tóxica', 'tóxica'],
    'revision_estado' => ['no revisada', 'correcta', 'incorrecta'],
];
```

- [ ] **Step 2: Update `decode_planta()` to also decode `imagenes_historial`**

```php
function decode_planta(array $row): array {
    foreach (['etiquetas', 'variaciones', 'imagenes', 'imagenes_historial'] as $f) {
        $row[$f] = $row[$f] ? json_decode($row[$f], true) : [];
        if (!is_array($row[$f])) $row[$f] = [];
    }
    $row['nombreCientifico'] = $row['nombre_cientifico'] ?? '';
    unset($row['nombre_cientifico']);
    $row['vistas'] = (int)($row['vistas'] ?? 0);
    return $row;
}
```

- [ ] **Step 3: Add `revision_estado` to `$allowed` and the enum-validation loop inside `build_payload()`**

```php
    $allowed = [
        'nombre', 'nombre_cientifico', 'categoria', 'descripcion',
        'luz', 'riego', 'cuidado', 'disponibilidad', 'sucursal', 'mascotas',
        'sku', 'etiquetas', 'variaciones', 'imagenes', 'revision_estado',
    ];
    $out = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) $out[$f] = $body[$f];
    }

    if (!$isUpdate) {
        if (empty($out['nombre'])) json_error('Campo "nombre" requerido', 400);
    }

    foreach (['categoria', 'luz', 'riego', 'cuidado', 'disponibilidad', 'sucursal', 'mascotas', 'revision_estado'] as $f) {
        if (isset($out[$f])) validate_enum($f, $out[$f]);
    }
```

- [ ] **Step 4: In the `PUT` handler, append replaced photos to `imagenes_historial` before the existing slug logic**

Insert this block right after `if (!$payload) json_error('Sin campos para actualizar', 400);` and before the `// Obtener el slug actual en la DB` comment:

```php
    // Conservar fotos reemplazadas — nunca se pierden, quedan en imagenes_historial.
    if (isset($payload['imagenes'])) {
        $stmtImgs = db()->prepare('SELECT imagenes, imagenes_historial FROM plantas WHERE id = :id LIMIT 1');
        $stmtImgs->execute([':id' => $id]);
        $imgRow = $stmtImgs->fetch();
        if ($imgRow) {
            $oldImgs = $imgRow['imagenes'] ? json_decode($imgRow['imagenes'], true) : [];
            $newImgs = json_decode($payload['imagenes'], true) ?: [];
            $historial = $imgRow['imagenes_historial'] ? json_decode($imgRow['imagenes_historial'], true) : [];
            if (!is_array($oldImgs)) $oldImgs = [];
            if (!is_array($historial)) $historial = [];
            $dropped = array_diff($oldImgs, $newImgs);
            foreach ($dropped as $url) {
                if (!in_array($url, $historial, true)) $historial[] = $url;
            }
            if ($dropped) $payload['imagenes_historial'] = json_encode(array_values($historial), JSON_UNESCAPED_UNICODE);
        }
    }

```

- [ ] **Step 5: Add the `PATCH` bulk-reset action — insert right before the final `json_error('Método no permitido', 405);`**

```php
if ($method === 'PATCH') {
    $action = $_GET['action'] ?? '';
    if ($action !== 'reset_revision') json_error('Acción no válida', 400);
    require_owner();
    db()->exec("UPDATE plantas SET revision_estado = 'no revisada'");
    json_response(['ok' => true]);
}

json_error('Método no permitido', 405);
```

(Remove the old standalone `json_error('Método no permitido', 405);` line — this replaces it.)

- [ ] **Step 6: Commit**

```bash
git add api/admin/plantas.php
git commit -m "feat: revision_estado, imagenes_historial e reset_revision en API admin"
```

---

### Task 3: Public backend — `api/plantas.php`

**Goal:** Guarantee `revision_estado` and `imagenes_historial` never reach the public API response.

**Files:**
- Modify: `api/plantas.php`

**Acceptance Criteria:**
- [ ] `decode_planta()` (public) strips `revision_estado` and `imagenes_historial` from every response, regardless of how the row was fetched (`SELECT *` is in use, so this must happen in PHP, not SQL).

**Verify:** Manual review. After deploy, `curl https://ornaplant.com.mx/api/plantas.php?id=<id>` should not contain `revision_estado` or `imagenes_historial` in the JSON — note this as a post-deploy check since there's no local server to hit.

**Steps:**

- [ ] **Step 1: Update `decode_planta()` in `api/plantas.php`**

```php
function decode_planta(array $row): array {
    foreach (['etiquetas', 'variaciones', 'imagenes'] as $field) {
        $row[$field] = $row[$field] ? json_decode($row[$field], true) : [];
        if (!is_array($row[$field])) $row[$field] = [];
    }
    // Mapear nombre_cientifico → nombreCientifico (frontend espera camelCase)
    $row['nombreCientifico'] = $row['nombre_cientifico'] ?? '';
    unset($row['nombre_cientifico']);
    $row['vistas'] = (int)($row['vistas'] ?? 0);
    // Campos internos de auditoría de fotos — nunca expuestos al público.
    unset($row['revision_estado'], $row['imagenes_historial']);
    return $row;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/plantas.php
git commit -m "fix: excluir revision_estado e imagenes_historial de la API pública"
```

---

### Task 4: `api.js` — `resetRevision()` client function

**Goal:** Expose a client function for the new bulk-reset endpoint.

**Files:**
- Modify: `api.js`

**Acceptance Criteria:**
- [ ] `resetRevision()` calls `PATCH /admin/plantas.php?action=reset_revision` with auth headers, same pattern as `deletePlant()`.

**Verify:** `grep -n "resetRevision" api.js` shows the new export.

**Steps:**

- [ ] **Step 1: Add `resetRevision()` right after `deletePlant()` in the "PLANTAS (admin, requieren JWT)" section**

```js
export async function resetRevision() {
  return apiFetch('/admin/plantas.php?action=reset_revision', {
    method: 'PATCH',
    headers: { ...authHeaders() },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add api.js
git commit -m "feat: resetRevision() en cliente API"
```

---

### Task 5: `js/admin/admin-state.js` — rename + revision helpers

**Goal:** Rename the disponibilidad style mapping, add a style mapping for the new revision field, add a state helper to bulk-update the in-memory list after a reset.

**Files:**
- Modify: `js/admin/admin-state.js`

**Acceptance Criteria:**
- [ ] `dispStyle()` maps `'de temporada'` → `'de-temporada'` (was `'bajo pedido'` → `'bajo-pedido'`).
- [ ] New `revisionStyle()` maps `'no revisada' | 'correcta' | 'incorrecta'` → matching CSS-class-safe strings.
- [ ] New `resetAllRevisionInList()` sets `revision_estado = 'no revisada'` on every plant in the in-memory list.

**Verify:** `grep -n "de-temporada\|revisionStyle\|resetAllRevisionInList" js/admin/admin-state.js` shows all three.

**Steps:**

- [ ] **Step 1: Rename `dispStyle()`**

```js
export function dispStyle(d) {
  return d === 'disponible' ? 'disponible' : d === 'de temporada' ? 'de-temporada' : 'agotado';
}

export function revisionStyle(r) {
  return r === 'correcta' ? 'correcta' : r === 'incorrecta' ? 'incorrecta' : 'no-revisada';
}
```

- [ ] **Step 2: Add `resetAllRevisionInList()` next to `removePlantFromList()`**

```js
export function resetAllRevisionInList() {
  plantList = plantList.map(p => ({ ...p, revision_estado: 'no revisada' }));
}
```

- [ ] **Step 3: Commit**

```bash
git add js/admin/admin-state.js
git commit -m "feat: revisionStyle, resetAllRevisionInList, renombrar de-temporada"
```

---

### Task 6: `admin.html` — markup

**Goal:** Rename the disponibilidad option/label everywhere in this file, add the new revision select (row + modal), add the photo-history mini-gallery, add the bulk-reset button + confirmation modal, add CSS for the new pill control.

**Files:**
- Modify: `admin.html`

**Acceptance Criteria:**
- [ ] No occurrence of `bajo pedido` / `bajo-pedido` remains in this file.
- [ ] `<select id="filterDisp">`, `<select id="f-disp">`, and the `.disp-select` in `plant-row-template` all show "De temporada" / value `de temporada`.
- [ ] New `<select class="revision-select">` exists in `plant-row-template`, and `<select id="f-revision">` exists in the plant modal.
- [ ] New mini-gallery container (`#imgHistorial0` / `#imgHistorialList0`) exists in the plant modal, near the existing image preview.
- [ ] New `owner-only` "Reiniciar revisión" button exists next to "Perfiles".
- [ ] New `#resetRevisionModal` exists with a typed-confirmation input and a disabled-by-default confirm button.
- [ ] CSS includes `.revision-select` pill styles and `.disp-select.de-temporada` (replacing `.disp-select.bajo-pedido`).

**Verify:** `grep -n "bajo pedido\|bajo-pedido" admin.html` returns nothing. `grep -n "revision-select\|f-revision\|resetRevisionModal\|imgHistorial0" admin.html` shows all the new pieces.

**Steps:**

- [ ] **Step 1: CSS — replace the `.disp-select.bajo-pedido` rule and add revision-select styles (around line 184-192)**

```css
    /* Availability select styled as pill badge */
    .disp-select {
      padding: 0.25rem 0.625rem; border-radius: 100px;
      font-size: 0.75rem; font-family: 'Plus Jakarta Sans',sans-serif; font-weight: 700;
      cursor: pointer; border: none; outline: none; appearance: none; -webkit-appearance: none;
      text-align: center; min-width: 90px;
    }
    .disp-select.disponible   { background: #dcfce7; color: #166534; }
    .disp-select.de-temporada { background: #fef9c3; color: #854d0e; }
    .disp-select.agotado      { background: #fee2e2; color: #991b1b; }

    /* Revisión interna — select pill, mismo patrón visual que disp-select */
    .revision-select {
      padding: 0.25rem 0.625rem; border-radius: 100px;
      font-size: 0.75rem; font-family: 'Plus Jakarta Sans',sans-serif; font-weight: 700;
      cursor: pointer; border: none; outline: none; appearance: none; -webkit-appearance: none;
      text-align: center; min-width: 100px;
    }
    .revision-select.no-revisada { background: #f1f5f3; color: #69776d; }
    .revision-select.correcta    { background: #dcfce7; color: #166534; }
    .revision-select.incorrecta  { background: #fee2e2; color: #991b1b; }
```

- [ ] **Step 2: Mobile responsive rule — find `.disp-select { flex: 1; max-width: 160px; }` (around line 412) and add the matching rule for revision-select**

```css
      .disp-select, .revision-select { flex: 1; max-width: 160px; }
```

- [ ] **Step 3: Rename the toolbar filter option (around line 596-601)**

```html
              <select id="filterDisp" class="toolbar-select" aria-label="Filtrar por disponibilidad">
                <option value="">Disponibilidad</option>
                <option value="disponible">Disponible</option>
                <option value="de temporada">De temporada</option>
                <option value="agotado">Agotado</option>
              </select>
```

- [ ] **Step 4: Add the "Reiniciar revisión" button next to "Perfiles" (around line 565-575)**

```html
              <div style="display:flex;align-items:center;gap:0.625rem;flex-wrap:wrap;">
                <button class="btn-ghost owner-only" data-action="open-users-modal" hidden>
                  <span class="material-symbols-outlined" style="font-size:1.125rem;">manage_accounts</span>
                  Perfiles
                </button>
                <button class="btn-ghost owner-only" data-action="open-reset-revision-modal" hidden>
                  <span class="material-symbols-outlined" style="font-size:1.125rem;">restart_alt</span>
                  Reiniciar revisión
                </button>
                <button class="btn-primary" id="addPlantBtn">
                  <span class="material-symbols-outlined">add</span>
                  Agregar Planta
                </button>
              </div>
```

- [ ] **Step 5: Rename + add fields in the plant modal (around line 705-723) — replace the "Disponibilidad y logística" block and add a new "Revisión interna" section right after it**

```html
        <p class="form-section"><span class="material-symbols-outlined">local_shipping</span> Disponibilidad y logística</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div>
            <label class="form-label" for="f-disp">Disponibilidad *</label>
            <select class="form-select" id="f-disp">
              <option value="disponible">Disponible</option>
              <option value="de temporada">De temporada</option>
              <option value="agotado">Agotado</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="f-suc">Sucursal *</label>
            <select class="form-select" id="f-suc">
              <option value="ambas">Ambas</option>
              <option value="matriz">Matriz</option>
              <option value="embarques">Embarques</option>
            </select>
          </div>
        </div>

        <p class="form-section"><span class="material-symbols-outlined">fact_check</span> Revisión interna (no visible al cliente)</p>
        <div>
          <label class="form-label" for="f-revision">Estado de revisión</label>
          <select class="form-select" id="f-revision">
            <option value="no revisada">No revisada</option>
            <option value="correcta">Correcta</option>
            <option value="incorrecta">Incorrecta</option>
          </select>
        </div>
```

- [ ] **Step 6: Add the photo-history mini-gallery right after the existing image preview block (around line 748-751)**

```html
          <div id="imgPreview0" style="display:none;margin-top:0.625rem;">
            <img id="imgPreviewEl0" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;border:1px solid #e8efeb;" alt="Preview">
          </div>
          <div id="imgHistorial0" style="display:none;margin-top:0.75rem;">
            <p style="font-size:0.75rem;color:#7da592;margin-bottom:0.375rem;font-weight:600;">Fotos anteriores</p>
            <div id="imgHistorialList0" style="display:flex;gap:0.5rem;flex-wrap:wrap;"></div>
          </div>
```

- [ ] **Step 7: Add `revision-select` to `plant-row-template`, rename `disp-select` options (around line 860-870)**

```html
      <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
        <select class="suc-select" aria-label="">
          <option value="ambas">Ambas</option>
          <option value="matriz">Matriz</option>
          <option value="embarques">Embarques</option>
        </select>
        <select class="disp-select" aria-label="">
          <option value="disponible">Disponible</option>
          <option value="de temporada">De temporada</option>
          <option value="agotado">Agotado</option>
        </select>
        <select class="revision-select" aria-label="">
          <option value="no revisada">No revisada</option>
          <option value="correcta">Correcta</option>
          <option value="incorrecta">Incorrecta</option>
        </select>
        <button class="btn-icon btn-edit edit-btn" aria-label="">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="btn-icon btn-delete delete-btn" aria-label="">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
```

- [ ] **Step 8: Add the bulk-reset confirmation modal — insert right after the closing `</div>` of `usersModal` (after line 833, before the "User row template" comment)**

```html
  <!-- MODAL: Reiniciar revisión masiva (solo dueño) -->
  <div class="modal-overlay" id="resetRevisionModal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="resetRevisionModalTitle">
    <div class="modal" style="max-width:480px;">
      <div class="modal-header">
        <h3 id="resetRevisionModalTitle" style="font-size:1.125rem;font-weight:700;margin:0;color:#1a3028;">Reiniciar revisión</h3>
        <button data-action="close-reset-revision-modal" style="background:none;border:none;cursor:pointer;padding:0.25rem;border-radius:6px;color:#7da592;" aria-label="Cerrar">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div style="padding:1.5rem;">
        <p style="font-size:0.875rem;color:#69776d;line-height:1.5;margin:0 0 1rem;">
          Esto pone el estado de revisión de <strong>todas</strong> las plantas en "No revisada". No se puede deshacer. La disponibilidad del catálogo no se ve afectada.
        </p>
        <label class="form-label" for="reset-revision-confirm">Escribe <strong>REINICIAR</strong> para confirmar</label>
        <input class="form-input" id="reset-revision-confirm" type="text" autocomplete="off" spellcheck="false">
      </div>
      <div style="padding:1rem 1.5rem;border-top:1px solid #e8efeb;display:flex;justify-content:flex-end;gap:0.75rem;">
        <button class="btn-ghost" data-action="close-reset-revision-modal">Cancelar</button>
        <button class="btn-primary" id="confirmResetRevisionBtn" disabled style="background:#991b1b;opacity:0.5;">
          <span class="material-symbols-outlined" style="font-size:1rem;">restart_alt</span>
          Reiniciar todas
        </button>
      </div>
    </div>
  </div>
```

- [ ] **Step 9: Commit**

```bash
git add admin.html
git commit -m "feat: UI de revisión interna — select, mini-galería, reinicio masivo"
```

---

### Task 7: `js/admin/admin-ui-list.js` — render revision select inline

**Goal:** Populate the new `.revision-select` in each row when the list renders, same pattern as `.disp-select`.

**Files:**
- Modify: `js/admin/admin-ui-list.js`

**Acceptance Criteria:**
- [ ] Each rendered row sets `.revision-select` value + class from `p.revision_estado`.
- [ ] Import of `revisionStyle` added.

**Verify:** `grep -n "revisionStyle\|revision-select" js/admin/admin-ui-list.js` shows the new wiring.

**Steps:**

- [ ] **Step 1: Update the import line**

```js
import {
  getPlants, getSearchTerm, getCurrentPage, dispStyle, revisionStyle,
  getFilterCat, getFilterDisp, getFilterSuc, getSortField, getSortDir,
} from './admin-state.js';
```

- [ ] **Step 2: In `renderList()`, right after the existing `.disp-select` block (around line 113-116), add the revision-select wiring**

```js
    const select = clone.querySelector('.disp-select');
    select.className = `disp-select ${dispStyle(p.disponibilidad)}`;
    select.value = p.disponibilidad || 'disponible';
    select.setAttribute('aria-label', `Disponibilidad de ${p.nombre}`);

    const revSelect = clone.querySelector('.revision-select');
    revSelect.className = `revision-select ${revisionStyle(p.revision_estado)}`;
    revSelect.value = p.revision_estado || 'no revisada';
    revSelect.setAttribute('aria-label', `Revisión de ${p.nombre}`);
```

- [ ] **Step 3: Commit**

```bash
git add js/admin/admin-ui-list.js
git commit -m "feat: render select de revisión en lista de plantas"
```

---

### Task 8: `js/admin/admin-form.js` — revision field + photo-history gallery

**Goal:** Load/save `revision_estado` in the plant modal, render the read-only photo-history mini-gallery.

**Files:**
- Modify: `js/admin/admin-form.js`

**Acceptance Criteria:**
- [ ] `openModal()` sets `f-revision` to the plant's current value when editing, `'no revisada'` when creating.
- [ ] `openModal()` renders `imagenes_historial` thumbnails (if any) and shows/hides the gallery container accordingly.
- [ ] `savePlantUI()` includes `revision_estado` in the payload sent to the API.

**Verify:** `grep -n "f-revision\|imagenes_historial\|renderImgHistorial" js/admin/admin-form.js` shows all three.

**Steps:**

- [ ] **Step 1: Add a `renderImgHistorial()` helper near the bottom of the file, next to `setVal()`**

```js
function renderImgHistorial(urls) {
  const wrap = document.getElementById('imgHistorial0');
  const list = document.getElementById('imgHistorialList0');
  if (!wrap || !list) return;
  list.innerHTML = '';
  if (!Array.isArray(urls) || urls.length === 0) {
    wrap.style.display = 'none';
    return;
  }
  urls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Foto anterior';
    img.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #e8efeb;';
    list.appendChild(img);
  });
  wrap.style.display = 'block';
}
```

- [ ] **Step 2: In `openModal()`, set `f-revision` and call the gallery renderer — extend the `if (id) { ... }` branch (around line 19-40)**

```js
  if (id) {
    const p = getPlants().find(x => x.id === id);
    if (!p) return;
    setVal('f-nombre', p.nombre);
    setVal('f-sci', p.nombreCientifico);
    setVal('f-cat', p.categoria);
    setVal('f-disp', p.disponibilidad);
    setVal('f-revision', p.revision_estado || 'no revisada');
    setVal('f-desc', p.descripcion);
    setVal('f-luz', p.luz);
    setVal('f-riego', p.riego);
    setVal('f-cuidado', p.cuidado);
    setVal('f-suc', p.sucursal || 'ambas');
    setVal('f-mascotas', p.mascotas);
    setVal('f-etiquetas', (p.etiquetas || []).join(', '));
    setVal('f-variaciones', (p.variaciones || []).join(', '));
    setVal('f-sku', p.sku || '');
    renderImgHistorial(p.imagenes_historial);
    const url = (p.imagenes || [])[0] || '';
    if (url) {
      pendingImageUrl = url;
      document.getElementById('imgPreviewEl0').src = url;
      document.getElementById('imgPreview0').style.display = 'block';
    }
  } else {
    ['f-nombre','f-sci','f-desc','f-etiquetas','f-variaciones','f-sku'].forEach(id => setVal(id, ''));
    setVal('f-cat', 'ornamental');
    setVal('f-disp', 'disponible');
    setVal('f-revision', 'no revisada');
    setVal('f-luz', 'luz indirecta');
    setVal('f-riego', 'medio');
    setVal('f-cuidado', 'fácil');
    setVal('f-suc', 'ambas');
    setVal('f-mascotas', 'no tóxica');
    renderImgHistorial([]);
  }
```

- [ ] **Step 3: In `savePlantUI()`, add `revision_estado` to the payload `data` object (around line 84-101)**

```js
  const data = {
    nombre,
    nombreCientifico: document.getElementById('f-sci').value.trim(),
    categoria:        document.getElementById('f-cat').value,
    disponibilidad:   document.getElementById('f-disp').value,
    revision_estado:  document.getElementById('f-revision').value,
    descripcion:      desc,
    luz:              document.getElementById('f-luz').value,
    riego:            document.getElementById('f-riego').value,
    cuidado:          document.getElementById('f-cuidado').value,
    sucursal:         document.getElementById('f-suc').value,
    mascotas:         document.getElementById('f-mascotas').value,
    etiquetas:  document.getElementById('f-etiquetas').value.split(',').map(s => s.trim()).filter(Boolean),
    variaciones: document.getElementById('f-variaciones').value.split(',').map(s => s.trim()).filter(Boolean),
    imagenes: pendingImageUrl
      ? [pendingImageUrl]
      : ['https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop'],
    sku: sku || null,
  };
```

- [ ] **Step 4: Commit**

```bash
git add js/admin/admin-form.js
git commit -m "feat: campo de revisión y mini-galería de fotos en modal de planta"
```

---

### Task 9: `js/admin/admin-ui-stats.js` — revision counts

**Goal:** Show "Por revisar" / "Revisadas" counts on the admin dashboard, computed from the already-loaded plant list (no new endpoint).

**Files:**
- Modify: `js/admin/admin-ui-stats.js`

**Acceptance Criteria:**
- [ ] Stats grid includes a "Por revisar" card (count of `revision_estado === 'no revisada'`) and a "Revisadas" card (count of `correcta` + `incorrecta`).

**Verify:** `grep -n "Por revisar\|Revisadas" js/admin/admin-ui-stats.js` shows both labels.

**Steps:**

- [ ] **Step 1: Update `renderStats()` to compute and include the new counts**

```js
export function renderStats() {
  const plants = getPlants();
  let disponibles = 0, agotadas = 0, porRevisar = 0, revisadas = 0;
  const cats = new Set();
  plants.forEach(p => {
    if (p.disponibilidad === 'disponible') disponibles++;
    if (p.disponibilidad === 'agotado') agotadas++;
    if ((p.revision_estado || 'no revisada') === 'no revisada') porRevisar++;
    else revisadas++;
    if (p.categoria) cats.add(p.categoria);
  });

  const stats = [
    { icon: 'local_florist', num: plants.length, label: 'Total Plantas' },
    { icon: 'check_circle',  num: disponibles,   label: 'Disponibles' },
    { icon: 'cancel',        num: agotadas,      label: 'Agotados' },
    { icon: 'fact_check',    num: porRevisar,    label: 'Por revisar' },
    { icon: 'task_alt',      num: revisadas,     label: 'Revisadas' },
    { icon: 'visibility',    num: getGlobalVisits(), label: 'Visitas Generales', detail: true },
    { icon: 'category',      num: cats.size,     label: 'Categorías' },
  ];

  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  // stats array is fully hardcoded — no user data reaches innerHTML here
  grid.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon">
        <span class="material-symbols-outlined">${s.icon}</span>
      </div>
      <div>
        <div class="stat-num">${s.num}</div>
        <div class="stat-label">
          ${s.label}
          ${s.detail ? '<button type="button" class="visits-detail-btn" data-action="open-visitas-modal">detalles</button>' : ''}
        </div>
      </div>
    </div>`).join('');
}
```

- [ ] **Step 2: Commit**

```bash
git add js/admin/admin-ui-stats.js
git commit -m "feat: contador de revisión en dashboard admin"
```

---

### Task 10: `js/admin/admin-events.js` — wire revision select + bulk reset

**Goal:** Inline-edit `.revision-select` with optimistic update + rollback (mirroring `.disp-select`), wire the bulk-reset button/modal flow including the typed-confirmation gate.

**Files:**
- Modify: `js/admin/admin-events.js`

**Acceptance Criteria:**
- [ ] Changing `.revision-select` in a row calls `updatePlant(id, { revision_estado })`, rolls back on error.
- [ ] "Reiniciar revisión" button (owner-only) opens `#resetRevisionModal`.
- [ ] Confirm button stays `disabled` until the input exactly matches `REINICIAR`.
- [ ] Confirming calls `resetRevision()`, updates local state via `resetAllRevisionInList()`, re-renders list + stats, closes modal, shows toast.
- [ ] Escape key also closes `#resetRevisionModal`.

**Verify:** `grep -n "revision-select\|resetRevisionModal\|resetRevision\|resetAllRevisionInList" js/admin/admin-events.js` shows the full wiring.

**Steps:**

- [ ] **Step 1: Update imports — add `revisionStyle`, `resetAllRevisionInList`, and `resetRevision`**

```js
import { getPlants, updatePlantInList, setSearchTerm, setCurrentPage, getCurrentPage, dispStyle, revisionStyle, setFilterCat, setFilterDisp, setFilterSuc, setSort, resetAllRevisionInList } from './admin-state.js';
import { renderList } from './admin-ui-list.js';
import { renderStats, openVisitasModal, closeVisitasModal } from './admin-ui-stats.js';
import { openModal, closeModal, savePlantUI, handleDeleteClick, handleImageUpload } from './admin-form.js';
import { doSignOut } from './admin-auth.js';
import { updatePlant, resetRevision } from '../../api.js?v=3';
import { showToast } from './admin-toast.js';
import { toggleNav, closeNav, toggleAccountMenu, closeAccountMenu, isAccountMenuOpen } from './admin-nav.js';
import { openUsersModal, closeUsersModal, createUserUI, handleUserDeleteClick, togglePassword } from './admin-users.js';
```

- [ ] **Step 2: Add a revision-select change listener right after the existing disponibilidad change listener (after the closing `});` of the first listener in `setupEvents()`)**

```js
  // Revisión en línea — optimista con rollback (sin efecto en disponibilidad)
  document.addEventListener('change', async (e) => {
    const sel = e.target.closest('.revision-select');
    if (!sel) return;
    const row = sel.closest('.plant-row');
    if (!row) return;
    const id = row.dataset.id;
    const val = sel.value;
    const plant = getPlants().find(p => p.id === id);
    if (!plant) return;
    const prev = plant.revision_estado;

    updatePlantInList(id, { revision_estado: val });
    sel.className = `revision-select ${revisionStyle(val)}`;
    renderStats();

    try {
      await updatePlant(id, { revision_estado: val });
    } catch {
      updatePlantInList(id, { revision_estado: prev });
      sel.className = `revision-select ${revisionStyle(prev)}`;
      sel.value = prev || 'no revisada';
      renderStats();
      showToast('Error al actualizar revisión.', 'error');
    }
  });
```

- [ ] **Step 3: Add a typed-confirmation `input` listener — insert near the existing `input` listener for `adminSearch`**

```js
  // Confirmación escrita para reinicio masivo de revisión
  document.addEventListener('input', (e) => {
    if (e.target.id === 'reset-revision-confirm') {
      const btn = document.getElementById('confirmResetRevisionBtn');
      if (!btn) return;
      const ok = e.target.value.trim() === 'REINICIAR';
      btn.disabled = !ok;
      btn.style.opacity = ok ? '1' : '0.5';
    }
  });
```

- [ ] **Step 4: Add click handlers for the reset-revision modal — insert inside the existing big `click` listener, near the users-modal handlers**

```js
    // Reinicio masivo de revisión (solo dueño)
    if (e.target.closest('[data-action="open-reset-revision-modal"]')) {
      closeAccountMenu(); closeNav();
      const input = document.getElementById('reset-revision-confirm');
      const btn = document.getElementById('confirmResetRevisionBtn');
      if (input) input.value = '';
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
      const modal = document.getElementById('resetRevisionModal');
      if (modal) modal.style.display = 'flex';
      return;
    }
    if (e.target.closest('[data-action="close-reset-revision-modal"]') || e.target.id === 'resetRevisionModal') {
      const modal = document.getElementById('resetRevisionModal');
      if (modal) modal.style.display = 'none';
      return;
    }
    if (e.target.closest('#confirmResetRevisionBtn')) {
      const btn = e.target.closest('#confirmResetRevisionBtn');
      if (btn.disabled) return;
      btn.disabled = true;
      resetRevision()
        .then(() => {
          resetAllRevisionInList();
          renderList();
          renderStats();
          const modal = document.getElementById('resetRevisionModal');
          if (modal) modal.style.display = 'none';
          showToast('Revisión reiniciada en todas las plantas.', 'success');
        })
        .catch((err) => {
          btn.disabled = false;
          showToast('Error al reiniciar: ' + err.message, 'error');
        });
      return;
    }
```

- [ ] **Step 5: Add `resetRevisionModal` to the Escape-key handler**

```js
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeVisitasModal();
      closeUsersModal();
      closeAccountMenu();
      closeNav();
      const resetModal = document.getElementById('resetRevisionModal');
      if (resetModal) resetModal.style.display = 'none';
    }
  });
```

- [ ] **Step 6: Commit**

```bash
git add js/admin/admin-events.js
git commit -m "feat: cablear select de revisión y flujo de reinicio masivo"
```

---

### Task 11: `catalogo.php` — rename + 4-tier sort

**Goal:** Rename the public filter option, add the disponible+popular → disponible → de-temporada → agotado ordering.

**Files:**
- Modify: `catalogo.php`

**Acceptance Criteria:**
- [ ] Filter radio shows "De temporada" with `value="de temporada"`.
- [ ] After filtering, the list is sorted into the 4 tiers described in the spec, preserving relative order within each tier.

**Verify:** `grep -n "de temporada\|tierOf" catalogo.php` shows the rename and the new sort function. Manual: serve the site locally (`python -m http.server 5500`), open `/catalogo.php`, confirm popular+available plants appear first.

**Steps:**

- [ ] **Step 1: Rename the filter radio (around line 465)**

```html
              <label class="filter-option"><input type="radio" name="disponibilidad" value="de temporada"> De temporada</label>
```

- [ ] **Step 2: Add a `tierOf()` helper above `applyFilters()` (around line 643)**

```js
      function tierOf(p) {
        const disp = (p.disponibilidad || '').toLowerCase();
        const popular = Array.isArray(p.etiquetas) && (p.etiquetas.includes('popular') || p.etiquetas.includes('recomendada'));
        if (disp === 'disponible' && popular) return 0;
        if (disp === 'disponible') return 1;
        if (disp === 'de temporada') return 2;
        return 3;
      }

      function applyFilters() {
```

- [ ] **Step 3: Sort `currentList` by tier right after the `.filter()` call, before `currentPage = 1; render();`**

```js
        currentList = plantas.filter(p => {
          if (q && !p.nombre.toLowerCase().includes(q) && !(p.nombreCientifico || '').toLowerCase().includes(q) && !(p.descripcion || '').toLowerCase().includes(q)) return false;
          if (filters.categoria !== 'todas' && p.categoria !== filters.categoria) return false;
          if (filters.disponibilidad !== 'todas' && (p.disponibilidad || '').toLowerCase() !== filters.disponibilidad.toLowerCase()) return false;
          if (filters.luz.length && !filters.luz.includes(p.luz)) return false;
          if (filters.cuidado.length && !filters.cuidado.includes(p.cuidado)) return false;
          if (filters.mascotas !== 'todas' && p.mascotas !== filters.mascotas) return false;
          return true;
        });
        // Array.sort es estable (ES2019+): conserva el orden relativo dentro de cada nivel.
        currentList.sort((a, b) => tierOf(a) - tierOf(b));
        currentPage = 1;
        render();
```

- [ ] **Step 4: Commit**

```bash
git add catalogo.php
git commit -m "feat: renombrar de temporada y ordenar catálogo en 4 niveles"
```

---

### Task 12: `planta.php` + `index.html` — rename badge/label maps

**Goal:** Finish the `bajo pedido` → `de temporada` rename on the plant detail page and the homepage's popular-plants widget, the two remaining public-facing files that hardcode the old enum value.

**Files:**
- Modify: `planta.php`
- Modify: `index.html`

**Acceptance Criteria:**
- [ ] No occurrence of `bajo pedido` remains in either file.
- [ ] Schema.org `Offers.availability` mapping in `planta.php` still maps the renamed key to `https://schema.org/PreOrder`.
- [ ] Badge class/label maps in both files use `de temporada`.

**Verify:** `grep -n "bajo pedido" planta.php index.html` returns nothing.

**Steps:**

- [ ] **Step 1: `planta.php` — rename the schema.org availability map (around line 86-90)**

```php
    $availMap = [
        'disponible'   => 'https://schema.org/InStock',
        'de temporada' => 'https://schema.org/PreOrder',
        'agotado'      => 'https://schema.org/OutOfStock',
    ];
```

- [ ] **Step 2: `planta.php` — rename the badge class/label maps (around line 229-230)**

```php
      $dispCls = ['disponible' => 'disp-available', 'de temporada' => 'disp-order', 'agotado' => 'disp-sold'];
      $dispLbl = ['disponible' => 'Disponible', 'de temporada' => 'De temporada', 'agotado' => 'Agotado'];
```

- [ ] **Step 3: `index.html` — rename the badge class/label maps (around line 303-304)**

```js
      const disp = { disponible: 'badge-available', 'de temporada': 'badge-order', agotado: 'badge-sold' };
      const dispL = { disponible: 'Disponible', 'de temporada': 'De temporada', agotado: 'Agotado' };
```

- [ ] **Step 4: Commit**

```bash
git add planta.php index.html
git commit -m "fix: renombrar bajo pedido a de temporada en página de planta e inicio"
```

---

### Task 13: `CLAUDE.md` — documentation update

**Goal:** Keep the project's enum documentation accurate. This file lives outside the git repo (`C:\Users\axdel\CLAUDE.md`, user home directory) — it is not part of this project's version control, so this task is an edit only, no commit.

**Files:**
- Modify: `C:\Users\axdel\CLAUDE.md` (outside the repo)

**Acceptance Criteria:**
- [ ] `disponibilidad` enum line reads `disponible | de temporada | agotado`.
- [ ] A new line documents `revision_estado` as internal-only.

**Verify:** Read the file back and confirm both lines.

**Steps:**

- [ ] **Step 1: Update the "Valid enum values" list**

```markdown
Valid enum values:
- `categoria`: `interior | exterior | suculenta | ornamental | árbol | medicinal`
- `luz`: `sol directo | luz indirecta | media sombra | sombra`
- `riego`: `bajo | medio | alto`
- `disponibilidad`: `disponible | de temporada | agotado`
- `sucursal`: `ambas | matriz | embarques`
- `mascotas`: `tóxica | no tóxica`
- `revision_estado` (interno, nunca expuesto al público): `no revisada | correcta | incorrecta`
```

- [ ] **Step 2: No commit** — this file is outside the git repository.

---

## Self-Review Notes

- **Spec coverage:** Every section of `2026-06-30-revision-disponibilidad-design.md` maps to a task — schema (1), admin backend (2), public backend (3), client (4), state/styling (5), markup (6), list rendering (7), modal form (8), stats (9), events (10), public catalog order (11), and the two extra public files the spec missed (`planta.php`, `index.html`) are covered in (12), found via a repo-wide grep for `bajo pedido` during plan-writing. Doc update (13).
- **Type consistency:** `revision_estado` values (`'no revisada' | 'correcta' | 'incorrecta'`) are identical across Task 2 (ENUMS), Task 5 (`revisionStyle`), Task 6 (HTML options), Task 8 (default), Task 9 (counts). `disponibilidad` rename (`'de temporada'`) is identical across Tasks 1, 2, 5, 6, 11, 12.
- **No placeholders:** every step ships literal, complete code — no "add validation" or "similar to Task N" shortcuts.
