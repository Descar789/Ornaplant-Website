# Cookie Consent Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar banner de consentimiento de cookies y cargar GA4 solo si el usuario acepta.

**Architecture:** `js/cookie-consent.js` maneja banner + estado en `localStorage` y exporta `hasConsent()`. `js/analytics.js` importa `hasConsent()` y solo carga GA si retorna `true`; para aceptación durante la visita escucha el evento `ornaplant:consent-ready`. Las 8 páginas públicas cargan `cookie-consent.js` en `<head>`. `admin.html` no lo carga.

**Tech Stack:** HTML/PHP público, JavaScript ES modules, vanilla CSS inline, `localStorage`.

---

## Execution Prerequisites

- Node.js disponible para `node --check`.
- Servidor HTTP local para QA manual (Python `http.server` o Live Server).

---

## File Map

| File | Change |
|------|--------|
| `js/cookie-consent.js` | Crear — banner DOM + consent storage + `hasConsent()` |
| `js/analytics.js` | Modificar — importar `hasConsent`, extraer `loadGA()`, gate en consent |
| `index.html` | Modificar — agregar script tag |
| `contacto.html` | Modificar — agregar script tag |
| `horarios.html` | Modificar — agregar script tag |
| `nosotros.html` | Modificar — agregar script tag |
| `servicios.html` | Modificar — agregar script tag |
| `sucursales.html` | Modificar — agregar script tag |
| `catalogo.php` | Modificar — agregar script tag |
| `planta.php` | Modificar — agregar script tag con base path |

---

## Execution Order

1. Task 1: `js/cookie-consent.js` — módulo independiente, sin dependencias del sitio.
2. Task 2: `js/analytics.js` — depende de que `cookie-consent.js` exporte `hasConsent`.
3. Task 3: Script tags en páginas + verificación final.

Tasks 1 y 2 no tocan las mismas páginas — pueden ejecutarse secuencialmente sin conflicto.

---

## Task 1: Crear js/cookie-consent.js

**Files:**
- Create: `js/cookie-consent.js`

- [ ] **Step 1: Crear el módulo**

Crear `js/cookie-consent.js` con este contenido exacto:

```js
const CONSENT_KEY = 'ornaplant_cookie_consent';

export function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

function accept() {
  localStorage.setItem(CONSENT_KEY, 'accepted');
  window.dispatchEvent(new CustomEvent('ornaplant:consent-ready'));
}

function decline() {
  localStorage.setItem(CONSENT_KEY, 'declined');
}

function injectBanner() {
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:10000',
    'background:#1a3028', 'color:#eef4ec',
    'padding:1rem 1.5rem',
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'gap:1rem', 'flex-wrap:wrap',
    'font-family:"Plus Jakarta Sans",system-ui,sans-serif', 'font-size:0.875rem',
  ].join(';');

  const text = document.createElement('p');
  text.style.cssText = 'margin:0;flex:1;min-width:0;line-height:1.5;';
  text.textContent = 'Usamos cookies de análisis para mejorar el sitio.';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:0.75rem;flex-shrink:0;';

  const btnBase = 'border-radius:6px;padding:0.5rem 1.25rem;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:0.875rem;font-weight:700;cursor:pointer;';

  const acceptBtn = document.createElement('button');
  acceptBtn.type = 'button';
  acceptBtn.textContent = 'Aceptar';
  acceptBtn.style.cssText = btnBase + 'background:#396452;color:#eef4ec;border:none;';
  acceptBtn.addEventListener('click', () => { accept(); banner.remove(); });

  const declineBtn = document.createElement('button');
  declineBtn.type = 'button';
  declineBtn.textContent = 'Rechazar';
  declineBtn.style.cssText = btnBase + 'background:none;color:#eef4ec;border:1px solid #56816d;';
  declineBtn.addEventListener('click', () => { decline(); banner.remove(); });

  actions.append(acceptBtn, declineBtn);
  banner.append(text, actions);
  document.body.appendChild(banner);
}

const stored = localStorage.getItem(CONSENT_KEY);
if (!stored) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBanner);
  } else {
    injectBanner();
  }
}
```

- [ ] **Step 2: Verificar sintaxis**

```powershell
node --check js/cookie-consent.js
```

Esperado: sin output (exit 0).

- [ ] **Step 3: Commit**

```powershell
git add js/cookie-consent.js
git commit -m "feat: add cookie consent module"
```

---

## Task 2: Actualizar js/analytics.js

**Files:**
- Modify: `js/analytics.js`

- [ ] **Step 1: Reemplazar contenido completo de js/analytics.js**

```js
import { GA_MEASUREMENT_ID } from '../config.js';
import { hasConsent } from './cookie-consent.js';

const measurementId = String(GA_MEASUREMENT_ID || '').trim();
const isActive = /^G-[A-Z0-9]+$/.test(measurementId) &&
                 !['localhost', '127.0.0.1'].includes(window.location.hostname);

function loadGA() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

if (isActive) {
  if (hasConsent()) {
    loadGA();
  } else {
    window.addEventListener('ornaplant:consent-ready', loadGA, { once: true });
  }
}
```

- [ ] **Step 2: Verificar sintaxis**

```powershell
node --check js/analytics.js
```

Esperado: sin output (exit 0).

- [ ] **Step 3: Verificar que cookie-consent es la única dependencia nueva**

```powershell
rg -n "import" js/analytics.js
```

Esperado: dos líneas — `config.js` y `./cookie-consent.js`.

- [ ] **Step 4: Commit**

```powershell
git add js/analytics.js
git commit -m "feat: gate analytics on cookie consent"
```

---

## Task 3: Script Tags en Páginas + Verificación Final

**Files:**
- Modify: `index.html`, `contacto.html`, `horarios.html`, `nosotros.html`, `servicios.html`, `sucursales.html`, `catalogo.php`, `planta.php`

- [ ] **Step 1: Agregar script tag en las 6 páginas HTML estáticas**

En `index.html`, `contacto.html`, `horarios.html`, `nosotros.html`, `servicios.html`, `sucursales.html` — agregar esta línea inmediatamente después del script tag de analytics en `<head>`:

```html
  <script type="module" src="js/cookie-consent.js?v=1"></script>
```

El `<head>` de cada página debe quedar con ambos tags juntos:

```html
  <script type="module" src="js/analytics.js?v=1"></script>
  <script type="module" src="js/cookie-consent.js?v=1"></script>
```

- [ ] **Step 2: Agregar script tag en catalogo.php**

Mismo patrón. Agregar después del tag de analytics:

```html
  <script type="module" src="js/analytics.js?v=1"></script>
  <script type="module" src="js/cookie-consent.js?v=1"></script>
```

- [ ] **Step 3: Agregar script tag en planta.php con base path dinámico**

Agregar después del tag de analytics en planta.php:

```php
  <script type="module" src="<?= $base ?>/js/analytics.js?v=1"></script>
  <script type="module" src="<?= $base ?>/js/cookie-consent.js?v=1"></script>
```

- [ ] **Step 4: Verificar cobertura**

```powershell
rg -n "cookie-consent\.js" index.html contacto.html horarios.html nosotros.html servicios.html sucursales.html catalogo.php planta.php admin.html
```

Esperado:
- 8 páginas públicas tienen match.
- `admin.html` no tiene match.

- [ ] **Step 5: Verificar sintaxis JS**

```powershell
node --check js/cookie-consent.js
node --check js/analytics.js
```

Esperado: ambos exit 0.

- [ ] **Step 6: QA manual**

Abrir en servidor local (`python -m http.server 5500` o Live Server):

1. Abrir `/index.html` con DevTools → Application → Local Storage vacío.
   - Banner visible en la parte inferior.
   - No hay petición a `googletagmanager.com`.

2. Hacer clic en **Rechazar**.
   - Banner desaparece.
   - Local Storage: `ornaplant_cookie_consent = 'declined'`.
   - Recargar página: sin banner, sin petición a googletagmanager.

3. Borrar Local Storage. Recargar. Hacer clic en **Aceptar**.
   - Banner desaparece.
   - Local Storage: `ornaplant_cookie_consent = 'accepted'`.
   - Con `GA_MEASUREMENT_ID` vacío: sin petición a googletagmanager (correcto).
   - Recargar: sin banner.

4. Abrir `/admin.html?tester=true`: sin banner.

- [ ] **Step 7: Commit**

```powershell
git add index.html contacto.html horarios.html nosotros.html servicios.html sucursales.html catalogo.php planta.php
git commit -m "feat: load cookie consent on public pages"
```

---

## Acceptance Criteria

- [ ] Banner aparece en primera visita (sin key en localStorage).
- [ ] Banner no aparece si ya hay decisión guardada.
- [ ] Aceptar → GA carga en esa misma visita sin reload (cuando `GA_MEASUREMENT_ID` sea válido).
- [ ] Rechazar → GA nunca carga.
- [ ] `admin.html` no carga `cookie-consent.js`.
- [ ] Con `GA_MEASUREMENT_ID = ''`, banner funciona pero GA no carga.
