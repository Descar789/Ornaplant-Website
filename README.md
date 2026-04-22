# 🌿 ORNAPLANT — Sitio Web Oficial

Sitio web de marketing para **ORNAPLANT SA DE CV**, comercializadora de plantas ornamentales en Cuautla, Morelos. Fundada en 1992, con dos sucursales y venta en menudeo, medio mayoreo y mayoreo.

---

## 📋 Tabla de Contenidos

- [Vista general](#vista-general)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Páginas](#páginas)
- [Firebase & Servicios externos](#firebase--servicios-externos)
- [Desarrollo local](#desarrollo-local)
- [Panel de administración](#panel-de-administración)
- [Sembrar datos iniciales](#sembrar-datos-iniciales)
- [Reglas de Firestore](#reglas-de-firestore)
- [Despliegue](#despliegue)

---

## Vista general

Sitio estático multi-página sin bundler ni framework. Se abre directamente en el navegador o con Live Server. Todo el JavaScript es vanilla ES Modules cargados vía CDN.

**Funcionalidades:**
- Catálogo de plantas con filtros por categoría, luz, riego, disponibilidad, sucursal y mascotas
- Detalle por planta con galería de imágenes, contador de vistas y sección de comentarios
- Plantas populares en la página de inicio cargadas desde Firestore
- Panel de administración con CRUD completo sobre Firestore
- Subida de imágenes a Cloudinary (upload no firmado desde el navegador)
- Contador de vistas por planta en Firestore

---

## Tecnologías

| Capa | Herramienta |
|------|-------------|
| Markup | HTML5 semántico |
| Estilos | CSS vanilla con custom properties |
| Scripts | JavaScript ES Modules (sin bundler) |
| Base de datos | Firebase Firestore |
| Imágenes | Cloudinary (upload preset no firmado) |
| Analítica | Firebase Analytics (GA4) |
| Íconos | Material Symbols Outlined (CDN) |
| Tipografía | Plus Jakarta Sans · Manrope (Google Fonts) |
| Hosting | GitHub Pages |

**Sin** npm, webpack, React ni ningún framework. Cero dependencias en producción.

---

## Estructura del proyecto

```
Ornaplant Website/
├── index.html          # Inicio / Hero
├── nosotros.html       # Sobre nosotros
├── servicios.html      # Servicios detallados
├── catalogo.html       # Catálogo con filtros
├── planta.html         # Detalle de planta (ruta: ?id=slug)
├── sucursales.html     # Mapa y datos de sucursales
├── horarios.html       # Horarios de atención
├── contacto.html       # Formas de contacto
├── admin.html          # Panel de administración
│
├── style.css           # Hoja de estilos global
├── script.js           # Header, hamburger, back-to-top, reveal animations
├── plantas.js          # Datos de plantas (fuente original / seed)
├── firebase.js         # Helpers de Firestore + Cloudinary
├── config.js           # Inicialización de Firebase (credenciales)
│
├── assets/             # Logos e imágenes estáticas
│   ├── logo-symbol-web.png
│   ├── logo-palabras-web.png
│   └── logo-horizontal-web.png
│
└── seed.html           # Script one-time para poblar Firestore (eliminar tras usar)
```

---

## Páginas

| Archivo | URL | Descripción |
|---------|-----|-------------|
| `index.html` | `/` | Héro, estadísticas, plantas populares desde Firestore |
| `nosotros.html` | `/nosotros.html` | Historia, valores y equipo |
| `servicios.html` | `/servicios.html` | Tipos de venta y servicios |
| `catalogo.html` | `/catalogo.html` | Catálogo filtrable cargado desde Firestore |
| `planta.html` | `/planta.html?id={slug}` | Detalle: galería, cuidados, WhatsApp CTA, vistas, comentarios |
| `sucursales.html` | `/sucursales.html` | Mapa y dirección de ambas sucursales |
| `horarios.html` | `/horarios.html` | Tabla de horarios por sucursal |
| `contacto.html` | `/contacto.html` | Email, WhatsApp, ubicación |
| `admin.html` | `/admin.html?tester=true` | Panel admin (protegido por URL param) |

---

## Firebase & Servicios externos

### Firestore — colección `plantas`

Cada documento usa el slug de la planta como ID:

```js
{
  nombre:           "Monstera",
  nombreCientifico: "Monstera deliciosa",
  categoria:        "interior",          // interior | exterior | suculenta | ornamental | árbol | medicinal
  descripcion:      "...",
  luz:              "luz indirecta",     // sol directo | luz indirecta | media sombra | sombra
  riego:            "medio",             // bajo | medio | alto
  cuidado:          "fácil",             // fácil | intermedia | difícil
  disponibilidad:   "disponible",        // disponible | bajo pedido | agotado
  sucursal:         "ambas",             // ambas | matriz | embarques
  mascotas:         "tóxica",            // tóxica | no tóxica
  etiquetas:        ["popular", "recomendada"],
  variaciones:      ["chico", "mediano", "grande"],
  imagenes:         ["https://res.cloudinary.com/..."],
  vistas:           42
}
```

Subcolección de comentarios: `plantas/{plantId}/comentarios`

```js
{
  nombre:    "Ana G.",
  mensaje:   "Muy buena planta, la recomiendo.",
  timestamp: Timestamp
}
```

### Cloudinary

| Campo | Valor |
|-------|-------|
| Cloud name | `dfigwymjb` |
| Upload preset | `ornaplant_plants` (unsigned) |
| Folder | `plantas` |
| URL base | `https://res.cloudinary.com/dfigwymjb/image/upload/` |

No se requiere API secret. Las subidas van directo desde el navegador.

### Firebase Analytics

Measurement ID configurado en `config.js`. Vistas de página registradas automáticamente vía GA4.

---

## Desarrollo local

No se requiere instalación. Dos opciones:

**Opción A — VS Code Live Server**
1. Instalar extensión [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Click derecho en cualquier `.html` → *Open with Live Server*

**Opción B — servidor HTTP estático**
```bash
# Python 3
python -m http.server 5500

# Node.js
npx serve .
```

> ⚠️ Los ES Modules no funcionan desde `file://`. Usar siempre un servidor local.

---

## Panel de administración

Acceso: `admin.html?tester=true`

| Función | Descripción |
|---------|-------------|
| Listado de plantas | Tabla con imagen, nombre, categoría, sucursal y vistas |
| Cambiar disponibilidad | Selector inline, persiste en Firestore al instante |
| Agregar / Editar planta | Modal con todos los campos |
| Subir imagen | Upload directo a Cloudinary con preview |
| Generar imagen IA | Botón preparado — pendiente conectar nanobanana2 |
| Eliminar planta | Elimina de Firestore con confirmación |
| Comentarios | Lista todos los comentarios con opción de eliminar |
| Estadísticas | Total plantas, disponibles, agotadas, vistas totales, categorías |

> **Seguridad:** `?tester=true` es solo para desarrollo. En producción reemplazar `checkAccess()` con Firebase Authentication.

---

## Sembrar datos iniciales

1. Abrir `seed.html` con Live Server
2. Click en **"Upload plants to Firestore"**
3. Esperar confirmación ✓ por cada planta
4. **Eliminar `seed.html`** del repositorio

El script usa `setDoc` con el ID del slug — idempotente, pero resetea `vistas` a `0` si se ejecuta de nuevo.

---

## Reglas de Firestore

Pegar en Firebase Console → Firestore → Reglas:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plantas/{plantId} {
      allow read: true;
      allow create, delete: if false;
      // Solo permite incrementar el contador de vistas
      allow update: if request.resource.data.diff(resource.data)
                       .affectedKeys().hasOnly(['vistas']);

      match /comentarios/{cId} {
        allow read: true;
        allow create: if request.resource.data.nombre is string
                      && request.resource.data.nombre.size() > 0
                      && request.resource.data.nombre.size() <= 80
                      && request.resource.data.mensaje is string
                      && request.resource.data.mensaje.size() > 0
                      && request.resource.data.mensaje.size() <= 500;
        allow update, delete: if false;
      }
    }
  }
}
```

---

## Despliegue

Alojado en **GitHub Pages** desde la rama `main`. No hay build step.

```bash
git add .
git commit -m "update"
git push origin main
```

GitHub Pages publica automáticamente en cada push.

---

## Contacto

**ORNAPLANT SA DE CV**  
📍 Cuautla, Morelos, México  
📧 informesornaplant@hotmail.com  
📱 WhatsApp: +52 735 102 4413

---

<div align="center">
  <sub>Sitio desarrollado con HTML · CSS · JavaScript · Firebase · Cloudinary</sub>
</div>
