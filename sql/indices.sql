-- Indices para queries comunes del catalogo publico y filtros admin.
-- Ejecutar DESPUES de schema.sql.

CREATE UNIQUE INDEX uk_plantas_slug          ON plantas (slug);
CREATE INDEX idx_plantas_categoria          ON plantas (categoria);
CREATE INDEX idx_plantas_disponibilidad     ON plantas (disponibilidad);
CREATE INDEX idx_plantas_sucursal           ON plantas (sucursal);
CREATE INDEX idx_plantas_mascotas           ON plantas (mascotas);
CREATE INDEX idx_plantas_sku                ON plantas (sku);
CREATE INDEX idx_plantas_creado_en          ON plantas (creado_en);
