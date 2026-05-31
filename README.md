# ORNAPLANT — Sitio Web Oficial

Sitio web para **ORNAPLANT SA DE CV**, comercializadora de plantas ornamentales en Cuautla, Morelos. Fundada en 1992, dos sucursales, venta en menudeo, medio mayoreo y mayoreo.

---

## Tecnologías

| Capa | Herramienta |
|------|-------------|
| Markup | HTML5 semántico |
| Estilos | CSS vanilla con custom properties |
| Scripts | JavaScript ES Modules (sin bundler) |
| Backend | PHP 8+ REST API |
| Base de datos | MySQL (PDO) |
| Auth admin | JWT HS256 propio |
| Imágenes | Subida local al hosting (`/uploads/plantas/`) |
| Íconos | Material Symbols Outlined (CDN) |
| Tipografía | Plus Jakarta Sans · Manrope (Google Fonts) |
| Hosting | Hostinger — `ornaplant.com.mx` |

Sin npm, webpack, React ni framework. Sin Firebase. Sin Cloudinary.

---

## Estructura del proyecto

```
Ornaplant Website/
├── index.html          # Inicio / Hero
├── nosotros.html       # Sobre nosotros
├── servicios.html      # Servicios
├── catalogo.html       # Catálogo filtrable
├── planta.php          # Detalle de planta (?id=slug o /planta/{slug})
├── sucursales.html     # Sucursales
├── horarios.html       # Horarios
├── contacto.html       # Contacto
├── admin.html          # Panel de administración
│
├── style.css           # Estilos globales
├── script.js           # Header, hamburger, back-to-top, scroll-reveal
├── config.js           # API_URL, WHATSAPP_NUMBER (autodetección local/prod)
├── api.js              # Cliente HTTP a la API PHP (Bearer JWT)
│
├── js/admin/           # Módulos del panel admin
│   ├── main.js         # Entrypoint — boot panel
│   ├── admin-auth.js   # Login, logout, JWT exp check
│   ├── admin-state.js  # Estado, filtros, orden
│   ├── admin-events.js # Delegación de eventos
│   ├── admin-form.js   # Modal, CRUD, upload
│   ├── admin-toast.js  # Notificaciones
│   ├── admin-ui-list.js   # Render del listado
│   └── admin-ui-stats.js  # Render de estadísticas
│
├── api/                # Backend PHP
│   ├── config.php      # Config global, .env loader, helpers JSON/CORS
│   ├── db.php          # Conexión PDO singleton
│   ├── jwt.php         # JWT HS256 sin librerías
│   ├── slug.php        # Generador de slugs únicos
│   ├── plantas.php     # GET público — lista y detalle de plantas
│   ├── visitas.php     # Contador de visitas generales
│   └── admin/
│       ├── auth.php    # POST login → JWT (8h)
│       ├── plantas.php # CRUD admin (requiere JWT)
│       └── upload.php  # Subida de imagen (requiere JWT)
│
├── sql/
│   ├── schema.sql      # Esquema de tablas
│   ├── indices.sql     # Índices
│   └── migrations/     # Migraciones incrementales
│
├── uploads/plantas/    # Imágenes subidas (gitignored)
└── assets/             # Logos e imágenes estáticas
```

---

## Páginas

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Hero, estadísticas, plantas populares |
| `nosotros.html` | Historia y valores |
| `servicios.html` | Tipos de venta |
| `catalogo.html` | Catálogo con filtros client-side |
| `planta.php` | Detalle: galería, cuidados, WhatsApp CTA, vistas |
| `sucursales.html` | Mapa y dirección |
| `horarios.html` | Horarios por sucursal |
| `contacto.html` | Email, WhatsApp, ubicación |
| `admin.html` | Panel CRUD — requiere login JWT |

---

## Desarrollo local

ES Modules requieren servidor HTTP (`file://` no funciona).

```bash
# Opción A — Python
cd "Ornaplant Website"
python -m http.server 5500

# Opción B — XAMPP
# Symlink o copia en htdocs/, acceder por http://localhost/ornaplant/
```

### Configurar `.env`

```bash
cp api/.env.example api/.env  # o editar api/.env directamente
```

Valores para local (XAMPP):

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ornaplant
DB_USER=root
DB_PASS=
JWT_SECRET=<string aleatorio >32 chars>
BASE_URL=http://localhost/ornaplant
```

### Crear DB

En phpMyAdmin: crear base de datos `ornaplant` (utf8mb4_unicode_ci), luego importar:

```
sql/schema.sql
sql/indices.sql
```

### Migraciones

Ejecutar en orden al actualizar:

```
sql/migrations/001_fix_cuidado_enum.sql
sql/migrations/002_sku_unique.sql
```

---

## Panel de administración

Acceso: `admin.html` → login con credenciales de la tabla `admins`.

| Función | Descripción |
|---------|-------------|
| Login | Email + contraseña → JWT 8h |
| Listado | Búsqueda, filtros (categoría/disponibilidad/sucursal), orden (nombre/SKU/vistas) |
| Disponibilidad | Selector inline con actualización optimista y rollback |
| Crear / Editar | Modal con validación inline por campo |
| Eliminar | 2 clicks para confirmar (sin `confirm()`) |
| Subir imagen | Upload al hosting con preview y validación 5MB |
| Estadísticas | Total, disponibles, agotadas, visitas, categorías |

Auth: JWT HS256 propio almacenado en `sessionStorage`. Expiry verificado client-side.

---

## API REST

Base URL: `https://ornaplant.com.mx/api` (producción) / autodetectada local.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/plantas.php` | — | Lista de plantas |
| GET | `/plantas.php?id={id}` | — | Detalle de planta |
| GET | `/visitas.php` | — | Total de visitas generales |
| POST | `/admin/auth.php` | — | Login → JWT |
| GET | `/admin/plantas.php` | JWT | Lista admin |
| POST | `/admin/plantas.php` | JWT | Crear planta |
| PUT | `/admin/plantas.php?id={id}` | JWT | Editar planta |
| DELETE | `/admin/plantas.php?id={id}` | JWT | Eliminar planta |
| POST | `/admin/upload.php` | JWT | Subir imagen |

---

## Despliegue

Hostinger — deploy via panel / FTP / git integration.

Archivos a subir al cambiar el admin:
```
admin.html
api.js
api/admin/plantas.php
js/admin/          ← carpeta completa
```

Ejecutar migraciones SQL pendientes en phpMyAdmin de Hostinger.

---

## Contacto

**ORNAPLANT SA DE CV** · Cuautla, Morelos, México  
📧 informesornaplant@hotmail.com · 📱 WhatsApp: +52 735 102 4413
