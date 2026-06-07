# Cookie Consent Banner — Design Spec

**Date:** 2026-06-07
**Goal:** Mostrar banner de consentimiento antes de cargar Google Analytics. GA solo se activa si el usuario acepta.

---

## Architecture

Dos módulos ES:

| Módulo | Responsabilidad |
|--------|----------------|
| `js/cookie-consent.js` | Inyecta banner, guarda decisión en `localStorage`, exporta `hasConsent()` |
| `js/analytics.js` | Importa `hasConsent()`, carga GA4 solo si retorna `true` |

`admin.html` no carga ninguno de los dos.

---

## cookie-consent.js

**Storage key:** `ornaplant_cookie_consent` → `'accepted'` | `'declined'`

**Al cargar la página:**
- Si key existe: no muestra banner. Si `'accepted'`, dispara evento `ornaplant:consent-ready` para que analytics.js cargue GA.
- Si key vacío: inyecta banner en DOM.

**Banner:** `position: fixed; bottom: 0; width: 100%` — sobre el footer, z-index alto.

Texto: *"Usamos cookies de análisis para mejorar el sitio. Puedes aceptarlas o rechazarlas."*

Botones:
- **Aceptar** — guarda `'accepted'`, elimina banner del DOM, dispara `ornaplant:consent-ready`
- **Rechazar** — guarda `'declined'`, elimina banner del DOM

**Exporta:**
```js
export function hasConsent() {
  return localStorage.getItem('ornaplant_cookie_consent') === 'accepted';
}
```

---

## analytics.js (cambios)

```js
import { hasConsent } from './cookie-consent.js';

function loadGA(measurementId) { /* ... inyecta gtag.js ... */ }

if (hasConsent()) {
  loadGA(measurementId);
} else {
  window.addEventListener('ornaplant:consent-ready', () => loadGA(measurementId));
}
```

---

## Páginas afectadas

8 páginas públicas agregan en `<head>`:
```html
<script type="module" src="js/cookie-consent.js?v=1"></script>
```
(`planta.php` usa `<?= $base ?>/js/cookie-consent.js?v=1`)

---

## Flujo de decisión

```
localStorage vacío  →  banner visible
                        ↓ Aceptar → 'accepted' → GA carga
                        ↓ Rechazar → 'declined' → GA nunca carga

localStorage = 'accepted'  →  sin banner, GA carga al inicio
localStorage = 'declined'  →  sin banner, GA no carga nunca
```

---

## Estilo del banner

Paleta existente del sitio:
- Fondo: `#1a3028` (verde oscuro)
- Texto: `#eef4ec`
- Botón Aceptar: `#396452` con hover `#203b31`
- Botón Rechazar: ghost border `#56816d`
- Font: `Plus Jakarta Sans` (ya cargada en el sitio)

---

## Acceptance Criteria

- [ ] Banner aparece en primera visita (sin localStorage key)
- [ ] Banner no aparece si ya hay decisión guardada
- [ ] Aceptar → GA carga en esa misma visita sin reload
- [ ] Rechazar → GA nunca carga, ni en esa visita ni en las siguientes
- [ ] `admin.html` no carga `cookie-consent.js`
- [ ] Con `GA_MEASUREMENT_ID = ''`, banner funciona pero GA no carga (correcto)
