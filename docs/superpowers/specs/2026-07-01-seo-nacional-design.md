# Diseño: SEO nacional (búsqueda de marca + "vivero mayorista")

**Fecha:** 2026-07-01
**Estado:** Aprobado, pendiente de plan de implementación (solo Parte A)

## Contexto

El sitio ya está indexado (`sitemap.php`, `robots.txt`) pero busca dos cosas nuevas:

1. Que variantes mal escritas de "ornaplant" también recomienden el sitio.
2. Que búsquedas de "viveros" o compra de plantas al mayoreo recomienden el sitio, no solo búsquedas locales ("Cuautla").

Se divide en dos partes independientes:
- **Parte A — código:** cambios en el repo (metadata, JSON-LD, copy). Se implementa con plan normal.
- **Parte B — fuera de código:** gestiones externas (Google Business Profile, directorios, reseñas, backlinks). Documentado como checklist de referencia, **no es tarea de implementación de código**.

### Estado actual verificado

- `index.html` ya tiene JSON-LD `@graph` sólido: `Organization` (línea 24-38, sin `alternateName`), `WebSite`, y dos `GardenStore`/`LocalBusiness` (Matriz línea 48-79, Embarques línea 80+) con `PostalAddress`, `geo`, `openingHoursSpecification` y `areaServed` limitado a `City: Cuautla`, `State: Morelos`, `City: Yautepec` (sin país).
- Todas las páginas (`index.html`, `catalogo.php`, `servicios.html`, `nosotros.html`, `sucursales.html`, `horarios.html`, `contacto.html`) tienen `<title>`, `meta description`, `og:*`, `twitter:*` — todos con foco 100% local ("en Cuautla", "en Cuautla, Morelos"), ninguno menciona "mayorista"/"mayoreo" en title/description.
- `sitemap.php` genera XML dinámico con todas las páginas estáticas + cada planta (por `slug` o `id`) desde la tabla `plantas` — está completo, no requiere cambios.
- `robots.txt` permite todo excepto `/admin.html` y `/seed.html`, referencia el sitemap — correcto, no requiere cambios.

## Parte A — Diseño (código)

### 1. Título + meta description

Se agrega "mayorista"/"mayoreo" de forma natural en dos páginas (sin tocar las demás, que tienen otro propósito):

- `catalogo.php`:
  - `<title>`: `Catálogo de Plantas Ornamentales — Vivero Mayorista en Cuautla | ORNAPLANT`
  - `meta description`: agrega "venta al mayoreo y menudeo" a la descripción existente.
- `servicios.html`:
  - `<title>`: `Venta de Plantas al Mayoreo y Menudeo | ORNAPLANT`
  - `meta description`: agrega "vivero mayorista en Morelos, envíos coordinados a todo México" (conecta con el badge de flete de `docs/superpowers/specs/2026-07-01-hero-badge-flete-nacional-design.md`).
- Los `og:title`, `og:description`, `twitter:title`, `twitter:description` de ambas páginas se actualizan igual (hoy duplican el title/description).

No se usa `<meta name="keywords">` — Google la ignora desde hace años, sería ruido sin efecto.

### 2. `alternateName` en JSON-LD `Organization` (`index.html`, línea ~24-38)

Se agrega el array:
```json
"alternateName": ["Ornaplan", "Ornaplat", "Orna Plant", "Plantorna", "Vivero Ornaplant", "Vivero Ornaplan"]
```
Señala a Google que esas variantes (mal escritas, incompletas o reordenadas) se refieren al mismo negocio. No garantiza autocorrección en la búsqueda, pero es la señal estándar de schema.org para esto — es la palanca real que el código puede mover.

### 3. Copy visible con "vivero mayorista" (`servicios.html`)

La sección de mayoreo ya existente (ver spec previo, contexto de `value-card` "Venta al Menudeo"/mayoreo) ajusta su copy para incluir 1-2 veces la frase "vivero mayorista" / "plantas al mayoreo" de forma natural en texto visible — el contenido visible pesa más para keywords que la metadata.

### 4. `areaServed` nacional en LocalBusiness (`index.html`, ambos bloques Matriz y Embarques)

Se agrega `{"@type": "Country", "name": "México"}` al array `areaServed` existente, **sin quitar** las entradas locales (Cuautla/Morelos/Yautepec) — mantiene relevancia de búsqueda local y suma la señal de alcance nacional para pedidos coordinados por flete.

### Archivos afectados (Parte A)

- `index.html` — JSON-LD (`alternateName`, `areaServed` x2).
- `catalogo.php` — title/description/og/twitter.
- `servicios.html` — title/description/og/twitter + copy visible de la sección mayoreo.

## Parte B — Checklist fuera de código (referencia, no implementable aquí)

Gestiones que el usuario debe hacer fuera del repositorio, priorizadas:

1. **Google Business Profile** — reclamar/verificar el perfil de ORNAPLANT (dirección, teléfono, horarios, fotos, categoría "Vivero"/"Garden center"). Es la señal más fuerte para aparecer en búsquedas de "viveros" con intención local y para que Google asocie variantes mal escritas del nombre al negocio.
2. **Directorios de negocio** — Google Maps (cubierto arriba), Páginas Amarillas México, directorios de cámaras de comercio/floricultura, marketplaces B2B (Kompass, Solostocks). Cada uno es backlink + señal de existencia del negocio mayorista.
3. **Reseñas** — pedir reseñas en Google a clientes de mayoreo recurrentes; volumen/frecuencia de reseñas es señal fuerte de ranking local.
4. **Backlinks de gremio/industria** — si ORNAPLANT pertenece a alguna asociación de viveristas/floricultores (Morelos o nacional), pedir enlace desde su directorio de miembros.
5. **Consistencia NAP** (Nombre-Dirección-Teléfono) — mismo formato exacto en Google Business, Facebook, Instagram, directorios; inconsistencias diluyen la señal de Google.

## Fuera de alcance

- No se crea una página nueva dedicada a "mayoreo" (se descartó a favor de ajustar páginas existentes).
- No se modifica `sitemap.php` ni `robots.txt` (ya están completos y correctos).
- La Parte B no genera tareas de implementación de código — es checklist de seguimiento del usuario, queda documentada aquí como referencia pero no pasa a `writing-plans`.
