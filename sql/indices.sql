-- Índices para queries comunes del catálogo público y filtros admin.
-- Ejecutar DESPUÉS de schema.sql.

CREATE INDEX idx_plantas_categoria      ON plantas (categoria);
CREATE INDEX idx_plantas_disponibilidad ON plantas (disponibilidad);
CREATE INDEX idx_plantas_sucursal       ON plantas (sucursal);
CREATE INDEX idx_plantas_mascotas       ON plantas (mascotas);
CREATE INDEX idx_plantas_sku            ON plantas (sku);
CREATE INDEX idx_plantas_creado_en      ON plantas (creado_en);
