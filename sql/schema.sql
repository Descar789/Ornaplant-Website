-- ORNAPLANT - esquema MySQL
-- Charset utf8mb4 / collation utf8mb4_unicode_ci.
-- Engine InnoDB para integridad transaccional.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS plantas;
CREATE TABLE plantas (
  id                VARCHAR(100)  NOT NULL,
  nombre            VARCHAR(150)  NOT NULL,
  slug              VARCHAR(180)  NULL,
  nombre_cientifico VARCHAR(150)  NOT NULL DEFAULT '',
  categoria         VARCHAR(50)   NOT NULL DEFAULT 'ornamental',
  descripcion       TEXT          NULL,
  luz               VARCHAR(50)   NOT NULL DEFAULT 'luz indirecta',
  riego             VARCHAR(50)   NOT NULL DEFAULT 'medio',
  cuidado           VARCHAR(50)   NOT NULL DEFAULT 'fácil',
  disponibilidad    VARCHAR(50)   NOT NULL DEFAULT 'disponible',
  sucursal          VARCHAR(50)   NOT NULL DEFAULT 'ambas',
  mascotas          VARCHAR(50)   NOT NULL DEFAULT 'no tóxica',
  sku               VARCHAR(100)  NULL,
  vistas            INT           NOT NULL DEFAULT 0,
  etiquetas         JSON          NULL,
  variaciones       JSON          NULL,
  imagenes          JSON          NULL,
  creado_en         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id            INT           NOT NULL AUTO_INCREMENT,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  creado_en     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
