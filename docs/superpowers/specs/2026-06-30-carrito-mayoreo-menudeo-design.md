# Diseño: Carrito multi-selección + separación mayoreo/menudeo

Fecha: 2026-06-30
Estado: aprobado (diseño)

## Objetivo

Este es el **Subsistema C** del pedido de 3 partes descrito en
`docs/superpowers/specs/2026-06-30-revision-disponibilidad-design.md`
(Subsistema A = revisión interna, ya implementado; Subsistema B = SEO
nacional, auditado — infraestructura técnica ya existía desde 2026-05-27,
solo falta copy de alcance nacional, fuera de este spec).

Permitir que un visitante seleccione varias plantas del catálogo (desde
`catalogo.php` y/o `planta.php`) y envíe un único mensaje de WhatsApp
ordenado (nombres, luego SKUs) en vez de consultar planta por planta.
Distinguir mayoreo de menudeo para ajustar el mensaje (envío vs. recoger
en sucursal), sin verificación real — es una declaración del cliente, la
calificación real sigue pasando por conversación humana en WhatsApp.

## Decisiones (confirmadas con el usuario)

- **Detección mayoreo/menudeo:** toggle autodeclarado por el visitante
  dentro del panel del carrito ("Para mi negocio/vivero" vs. "Para mi
  casa"). Sin verificación, sin umbral de cantidad — es una declaración
  que ajusta el texto del mensaje de WhatsApp, nada más.
- **Restricción geográfica:** ninguna restricción dura. Si el comprador
  elige menudeo, el mensaje indica que el pedido es para recoger en
  sucursal (sin mención de envío). Si elige mayoreo, el mensaje no
  restringe nada — el envío se negocia en la conversación de WhatsApp
  como ya ocurre hoy. No hay verificación de ubicación.
- **Alcance del botón "agregar al carrito":** aparece tanto en las
  tarjetas de `catalogo.php` como en `planta.php`.
- **Persistencia:** `localStorage`, sobrevive navegación entre páginas y
  recargas. Mismo patrón defensivo (try/catch silencioso) que
  `js/cookie-consent.js`.
- **Cantidad por ítem:** no aplica. El carrito es un conjunto de plantas
  distintas (agregar una planta ya presente es no-op), sin contador de
  unidades — el cliente especifica cantidades en la conversación de
  WhatsApp.
- **UI del carrito:** botón flotante con badge de conteo (mismo patrón
  visual que el botón "volver arriba" ya existente), visible en **las 8
  páginas públicas** (no en `admin.html`) cuando el carrito tiene al
  menos un ítem; oculto si está vacío. Click abre un panel deslizable
  (slide-out) con la lista de ítems, botón de quitar por ítem, el toggle
  mayoreo/menudeo, y el botón "Enviar por WhatsApp".
- **Formato del mensaje:** dos secciones — "Plantas:" (nombres
  numerados) y luego "SKUs:" (SKUs numerados en el mismo orden,
  `(sin SKU)` como placeholder si la planta no tiene SKU asignado, para
  mantener ambas listas alineadas línea a línea). Una línea final según
  el tipo de comprador declarado; si nunca se declaró, esa línea se
  omite por completo.
- **Vaciado del carrito:** automático, inmediatamente después de hacer
  click en "Enviar por WhatsApp" (se trata como un checkout completado).

## Arquitectura

Dos módulos JS nuevos, siguiendo patrones ya existentes en el proyecto:

- **`js/cart-state.js`** — estado respaldado por `localStorage` (mismo
  estilo getter/setter que `js/admin/admin-state.js`, pero persistido en
  vez de solo en memoria). Guarda: lista de ítems
  `[{id, nombre, sku, slug}]` y tipo de comprador
  (`'mayoreo' | 'menudeo' | null`). Todas las llamadas a `localStorage`
  envueltas en try/catch, igual que `js/cookie-consent.js`.
- **`js/cart.js`** — inyecta el botón flotante + panel deslizable en el
  DOM al cargar, vía `createElement` (mismo patrón de inyección que
  `js/cookie-consent.js` — no requiere cambios de markup HTML en
  ninguna página). Renderiza el contenido del carrito, conecta los
  botones de quitar, el toggle mayoreo/menudeo, y el botón de envío.
  Importa `cart-state.js` y `WHATSAPP_NUMBER` de `config.js`.

Ambos módulos se cargan mediante una sola línea
`<script type="module" src="js/cart.js"></script>` agregada a las 8
páginas públicas (`index.html`, `nosotros.html`, `servicios.html`,
`catalogo.php`, `planta.php`, `sucursales.html`, `horarios.html`,
`contacto.html`).

## Componentes y flujo de datos

### `cart-state.js` — API exportada

```js
getCart()                          // -> [{id, nombre, sku, slug}, ...]
addToCart({id, nombre, sku, slug}) // no-op si id ya existe
removeFromCart(id)
clearCart()
getCartCount()                     // -> number
getBuyerType()                     // -> 'mayoreo' | 'menudeo' | null
setBuyerType(type)
```

Cada mutador escribe inmediatamente a `localStorage`; la copia en
memoria del módulo se mantiene sincronizada (lectura al cargar el
módulo, escritura en cada mutación).

### Botones "agregar al carrito"

- **`catalogo.php`**: cada tarjeta renderizada obtiene un botón; el
  click lee los datos de la planta ya presentes en el array `plantas`
  cargado del lado cliente (el catálogo ya obtiene objetos completos vía
  API) y llama a `addToCart()`.
- **`planta.php`** (renderizado en servidor, sin fetch cliente de la
  planta): el bloque `<script>` inline existente ya tiene disponibles
  del lado servidor los datos de la planta (id/nombre/sku/slug), usados
  hoy para el CTA de WhatsApp de una sola planta. Se exponen vía
  `data-*` en el nuevo botón (`data-id`, `data-nombre`, `data-sku`,
  `data-slug`); `cart.js` los lee de ahí al hacer click.

### `cart.js` — comportamiento en cada página pública

- Renderiza el botón flotante (oculto si `getCartCount() === 0`), badge
  muestra el conteo.
- Click abre el panel: lista de ítems (nombre + botón quitar ✕), toggle
  de tipo de comprador (`Para mi negocio/vivero` vs. `Para mi casa`),
  botón "Enviar por WhatsApp".
- Insertar nombres de planta en el panel usa `textContent`, nunca
  `innerHTML` (los datos vienen de contenido ya confiable cargado por
  admins, pero se evita el patrón inseguro de todos modos).
- Al enviar: construye el mensaje, abre
  `https://wa.me/{WHATSAPP_NUMBER}?text=...` (mismo patrón `wa.me` ya
  usado en `catalogo.php`/`planta.php`), luego llama a `clearCart()`
  inmediatamente — el botón flotante desaparece tras el envío.

### Plantilla del mensaje de WhatsApp

```
Hola, me interesan estas plantas:

Plantas:
1. Sansevieria
2. Ficus lyrata

SKUs:
1. SKU-123
2. (sin SKU)

Pedido de mayoreo.
```

(o `Pedido de menudeo — recojo en sucursal.` si el tipo declarado es
menudeo; si nunca se declaró tipo de comprador, esa última línea se
omite por completo y el mensaje termina en la sección de SKUs).

## Seguridad / no romper nada

- Nombres y SKUs se insertan con `textContent`, no `innerHTML` — sin
  vector XSS aunque el nombre de una planta contuviera caracteres
  especiales.
- `localStorage` envuelto en try/catch en cada llamada — navegación
  privada o almacenamiento bloqueado no rompe la página, el carrito
  simplemente se comporta como si estuviera vacío y no persiste.
- El carrito no depende de ningún endpoint nuevo del backend — es
  enteramente client-side, no hay cambios en `api/` ni en el esquema de
  base de datos.
- Ítems del carrito son una instantánea (`{id, nombre, sku, slug}`)
  tomada al momento de agregar — si una planta se elimina del catálogo
  después, el ítem sigue mostrándose y funcionando normalmente en el
  carrito y en el mensaje final, sin necesidad de revalidar contra la
  API.

## Pruebas

Checklist manual (sin framework de pruebas, mismo patrón que el resto
del proyecto):

1. Agregar la misma planta dos veces → solo un ítem en el carrito.
2. Agregar plantas desde `catalogo.php` y desde `planta.php` → ambas
   aparecen en el panel tras navegar entre páginas (persistencia vía
   `localStorage`).
3. Quitar un ítem → el badge actualiza el conteo, el panel se
   re-renderiza.
4. Cambiar el tipo de comprador → el mensaje de WhatsApp incluye la
   línea correcta (mayoreo o menudeo).
5. Enviar sin haber elegido tipo de comprador → el mensaje omite esa
   línea, no hay error.
6. Enviar → el carrito se vacía, el botón flotante desaparece, el link
   `wa.me` abre con el mensaje correctamente formateado (sección de
   nombres + sección de SKUs, `(sin SKU)` para plantas sin SKU asignado).
7. Carrito vacío → el botón flotante no aparece en ninguna página
   pública.
8. Navegación privada / `localStorage` bloqueado → sin errores en
   consola, el carrito simplemente no persiste entre cargas.

## Archivos

**Nuevos**
- `js/cart-state.js`
- `js/cart.js`

**Modificados**
- `catalogo.php` — botón "agregar al carrito" por tarjeta, import del
  script del carrito.
- `planta.php` — botón "agregar al carrito" junto al CTA existente de
  WhatsApp, `data-*` con los datos de la planta, import del script del
  carrito.
- `index.html`, `nosotros.html`, `servicios.html`, `sucursales.html`,
  `horarios.html`, `contacto.html` — solo agregar el import del script
  del carrito (para que el botón flotante sea visible sitewide cuando
  el carrito tiene ítems).

## Fuera de alcance

- Verificación real de mayorista (RFC, cuenta registrada, etc.) — el
  toggle es autodeclarado, sin consecuencias de backend.
- Restricción geográfica dura (bloqueo por ubicación) — descartada,
  solo afecta el texto del mensaje.
- Cantidad por ítem — el carrito es un conjunto, no un carrito de
  cantidades.
- Checkout/pago en el sitio — el flujo sigue terminando en una
  conversación de WhatsApp, como hoy.
