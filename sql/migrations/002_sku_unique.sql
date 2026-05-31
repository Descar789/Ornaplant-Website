-- Agrega constraint UNIQUE al campo sku.
-- MySQL permite múltiples NULL en UNIQUE — plantas sin SKU no se afectan.
-- Ejecutar una sola vez en produccion antes de desplegar Fase 2.
ALTER TABLE plantas ADD UNIQUE KEY uk_sku (sku);
