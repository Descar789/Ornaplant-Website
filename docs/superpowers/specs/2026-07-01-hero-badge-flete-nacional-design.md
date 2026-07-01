# Diseño: badge de cobertura nacional de flete en el hero

**Fecha:** 2026-07-01
**Estado:** Aprobado, pendiente de plan de implementación

## Contexto

Se pide que en el inicio (`index.html`) sea evidente y llamativo que ORNAPLANT puede coordinar el envío de plantas a cualquier parte del país.

Aclaración importante del usuario: **no** es paquetería individual — es que las compañías de flete con las que trabaja ORNAPLANT tienen alcance a toda la República Mexicana. El mensaje debe transmitir eso, no dar a entender un servicio de paquetería tipo courier.

### Estado actual verificado

- `index.html:148-167` — sección `.hero`: `.eyebrow` (línea 152) → `<h1>` (153) → párrafo descriptivo (154) → `.hero-actions` con dos botones (155-163).
- `servicios.html` ya menciona "vinculación con fletes" (línea 161) y "fletes locales" (línea 239/256) — esa copy se queda igual, describe el servicio real (flete regional/coordinado, no paquetería). Este cambio es solo un mensaje adicional y más visible en el inicio, no una reescritura del servicio.
- `style.css:358-370` define `.badge` (pill genérico: `border-radius:100px`, ícono+texto, `font-family: var(--font-heading)`), usado hoy en tarjetas de planta sobre fondos claros.
- `style.css:741-761` — `.hero` tiene imagen de fondo con overlay oscuro (`.hero::before`, gradiente `rgba(10,30,18,...)`), por lo que el badge nuevo necesita paleta propia para tener contraste (los `.badge-*` existentes usan fondos claros pensados para fondo blanco de las tarjetas, no sirven tal cual sobre el hero).

## Diseño

### Copy

`Coordinamos flete a cualquier parte de México` — deja claro que es una gestión/coordinación de ORNAPLANT con transportistas, no un envío tipo paquetería.

### Markup (`index.html`)

Nuevo elemento dentro de `.hero-content`, entre el párrafo descriptivo (línea 154) y `.hero-actions` (línea 155):

```html
<p class="hero-shipping-badge">
  <span class="material-symbols-outlined" aria-hidden="true">local_shipping</span>
  Coordinamos flete a cualquier parte de México
</p>
```

### Estilo (`style.css`, nueva regla cerca de `.hero-actions` línea 797)

Reusa el patrón visual de `.badge` (pill, ícono+texto en línea) pero con paleta propia para destacar sobre el fondo oscuro del hero, ya que los `.badge-*` existentes (verde/magenta/tierra) están pensados para fondo claro:

- Fondo: `rgba(255,255,255,0.12)` (glass sutil sobre la imagen).
- Borde: `1px solid rgba(255,255,255,0.25)`.
- Texto: blanco.
- Ícono: color acento verde del sitio (mismo verde que `.hero-actions .btn-accent` u otro verde-claro de la paleta, para que el ícono resalte contra el fondo semitransparente).
- `font-size: 0.85rem`, `font-weight: 700` — más grande que `.badge` normal (0.7rem) porque es mensaje destacado, no etiqueta de producto.
- `display:inline-flex; align-items:center; gap:0.4rem; padding:0.45rem 0.9rem; border-radius:100px; margin-bottom:1.5rem;` (separación del párrafo de arriba y de los botones de abajo).

## Archivos afectados

- `index.html` — nuevo `<p class="hero-shipping-badge">` en el hero.
- `style.css` — nueva regla `.hero-shipping-badge`.

## Fuera de alcance

- No se toca `servicios.html` ni ninguna otra página — solo el hero del inicio.
- No se agrega badge global (header/announcement bar) ni se replica en otras páginas.
- No implica cambio real de servicio (sigue siendo flete coordinado, no paquetería) — solo mensaje/copy.
