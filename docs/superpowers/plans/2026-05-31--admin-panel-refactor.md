# Admin Panel Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task.

Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Ornaplant admin panel into compact, maintainable modules
while fixing the highest-risk issues in the current CRUD flow.

**Architecture:** Keep the PHP/MySQL/JWT backend and current visual design.
Move admin JavaScript out of `admin.html` into one entrypoint plus three focused
modules under `js/admin/`. Keep `api.js` as the only HTTP client. Do not expand
scope into dashboard, audit logs, soft delete, or multi-image until the base CRUD
is stable.

**Tech Stack:** Static HTML/CSS/ES modules, PHP REST endpoints, MySQL, JWT,
local image uploads.

---

## Context

Canonical collaboration copy:

- `ai-collaboration/refactor-admin-panel.md`

Related Superpowers/Codex contribution and critique:

- `.superpowers/brainstorm/762-1780251105/content/codex-aporte-admin-panel.md`
- `.superpowers/brainstorm/762-1780251105/content/codex-critique.html`

Do not implement Phase 2 or later until Phase 1 has been reviewed.

## Phase 1 Acceptance Criteria

- [ ] No `onclick`, `onchange`, or `onkeydown` remains in `admin.html`.
- [ ] No admin functions are exposed through `window.*`.
- [ ] `admin.html` imports one entrypoint: `js/admin/main.js`.
- [ ] The admin JS uses only these new modules: `main.js`, `state.js`,
  `ui.js`, `actions.js`.
- [ ] Login, logout, search, pagination, create, edit, delete, image upload
  preview, modal close, Escape close, and availability update still work.
- [ ] Create and update are explicit flows; no `POST` -> `PUT` retry based on
  error text like `includes('duplicad')`.
- [ ] Backend owns the generated plant ID on create.
- [ ] `isAdminLogged()` rejects expired JWTs or clears expired sessions.
- [ ] Unused Firebase-era UI (`accessDenied`) and unused avatar UI are removed
  or justified.
- [ ] `cuidado` uses `intermedio` as the canonical value for new data.
- [ ] Availability updates perform optimistic UI changes and rollback on server
  failure.
- [ ] Plant list rendering does not inject editable plant data through unsafe
  `innerHTML`.
- [ ] `README.md` reflects PHP/MySQL/JWT/local uploads and removes obsolete
  Firebase/Cloudinary/tester references.

## Task 1: Create Compact Module Skeleton

**Files:**

- Create: `js/admin/main.js`
- Create: `js/admin/state.js`
- Create: `js/admin/ui.js`
- Create: `js/admin/actions.js`
- Modify: `admin.html`

- [ ] Create the four module files.
- [ ] Make `admin.html` import `js/admin/main.js` with `type="module"`.
- [ ] Keep existing inline script temporarily until later tasks migrate logic.
- [ ] Verify the panel still loads exactly as before.

## Task 2: Move State and Safe UI Rendering

**Files:**

- Modify: `js/admin/state.js`
- Modify: `js/admin/ui.js`
- Modify: `js/admin/main.js`
- Modify: `admin.html`

- [ ] Move `plantList`, `editingId`, `globalVisits`, `pendingImageUrl`,
  `adminSearchTerm`, and `adminCurrentPage` into `state.js`.
- [ ] Move stats, list, pagination, modal fill/reset, image preview, screen
  switching, and toast helpers into `ui.js`.
- [ ] Build plant rows with DOM APIs and `textContent`; do not interpolate plant
  data into unsafe `innerHTML`.
- [ ] Review dynamic attributes: image `src`, `data-id`, and `aria-label`.
- [ ] Verify stats, search, pagination, modal open, modal fill, and image
  preview.

## Task 3: Move Events and Remove Inline Handlers

**Files:**

- Modify: `js/admin/actions.js`
- Modify: `js/admin/main.js`
- Modify: `admin.html`

- [ ] Wire login button, logout buttons, Enter key submit, add plant button,
  modal close buttons, Escape close, overlay close, pagination clicks, search
  input, availability select changes, delete buttons, edit buttons, save button,
  and upload input through `addEventListener` or event delegation.
- [ ] Remove every `onclick`, `onchange`, and `onkeydown` from `admin.html`.
- [ ] Remove all `window.*` admin exports.
- [ ] Verify all previously clickable controls still work.

## Task 4: Split Create and Update Flows

**Files:**

- Modify: `api.js`
- Modify: `js/admin/actions.js`
- Modify: `api/admin/plantas.php` if response shape needs adjustment

- [ ] Replace fragile `savePlant()` behavior with explicit create/update calls:
  `createPlant(data)` for `POST` and `updatePlant(id, data)` for `PUT`.
- [ ] On create, do not generate the plant ID in frontend JS.
- [ ] Use the `id` returned by the backend to update `plantList`.
- [ ] On edit, keep using the existing `editingId`.
- [ ] Verify creating a plant with accents in its name does not depend on JS
  slug generation.

## Task 5: Auth Expiry and Dead UI Cleanup

**Files:**

- Modify: `api.js`
- Modify: `admin.html`
- Modify: `js/admin/actions.js`
- Modify: `js/admin/ui.js`

- [ ] Decode JWT payload client-side enough to inspect `exp`.
- [ ] Make `isAdminLogged()` return false for expired tokens and clear session
  storage when expired.
- [ ] Remove `accessDenied` if it remains unused in the JWT flow.
- [ ] Remove `adminAvatar` if no avatar is ever provided.
- [ ] Verify an expired token shows the login screen instead of flashing the
  panel.

## Task 6: Normalize `cuidado`

**Files:**

- Modify: `admin.html`
- Modify: `api/admin/plantas.php`
- Modify: `sql/import.sql` only if seed data should be normalized
- Optional migration: `sql/migrations/004_normalize_cuidado.sql`

- [ ] Use `intermedio` as the HTML option value for "Intermedio".
- [ ] Keep PHP accepting `intermedia` temporarily for existing records.
- [ ] If adding a migration, update old rows from `intermedia` to `intermedio`.
- [ ] Verify create/edit sends `intermedio` for new saves.

## Task 7: Availability Rollback

**Files:**

- Modify: `js/admin/actions.js`
- Modify: `js/admin/state.js`
- Modify: `js/admin/ui.js`

- [ ] Store the previous availability before optimistic update.
- [ ] Update state, select class, and stats immediately.
- [ ] On API failure, restore previous state, select value/class, and stats.
- [ ] Show a toast error instead of `alert()`.
- [ ] Verify rollback by forcing the API call to fail in local testing.

## Task 8: README Cleanup

**Files:**

- Modify: `README.md`

- [ ] Remove obsolete Firebase, Firestore, Cloudinary, and `tester=true`
  references.
- [ ] Document PHP/MySQL/JWT/local upload architecture.
- [ ] Document admin access and local server requirement for ES modules.
- [ ] Verify README matches actual files and endpoints.

## Phase 2 Placeholder

Do not execute until Phase 1 is reviewed.

- Validations inline and toasts for remaining form errors.
- SKU uniqueness protection in backend if SKU is a business-unique field.
- Catalog filters and sorting.

## Phase 3 Pre-Planning Gate

Do not write implementation tasks for multi-image until these decisions are made:

- Does removing a thumbnail also delete the physical file?
- How are orphan files cleaned when upload succeeds but save is canceled?
- Can images be uploaded before a plant exists?
- What filename format is canonical: `SKU-uniqid.ext`, `SKU-timestamp.ext`, or
  another format?

After decisions, plan backend upload and gallery UI as a separate phase.

## Future Optional Work

Not part of the refactor commitment:

- Top viewed plants.
- Incomplete plant alerts.
- Backend audit logs.
- Soft delete and trash view.

Only implement these when there is operational need. Audit logs and soft delete
touch multiple PHP endpoints and should not be bundled with the base refactor.
