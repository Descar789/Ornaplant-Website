-- 005_revision_estado.sql - estado de revision interno
-- (auditoria de fotos) y renombrado del enum de disponibilidad
-- 'bajo pedido' -> 'de temporada'.
--
-- Aplicar en Hostinger via phpMyAdmin -> pestana SQL.
-- Sin impacto visible en catalogo publico, salvo el rename del enum
-- (la disponibilidad sigue siendo 100% manual, como hoy).

ALTER TABLE plantas
  ADD COLUMN revision_estado    VARCHAR(20) NOT NULL DEFAULT 'no revisada' AFTER disponibilidad,
  ADD COLUMN imagenes_historial JSON        NULL                          AFTER imagenes;

UPDATE plantas SET disponibilidad = 'de temporada' WHERE disponibilidad = 'bajo pedido';
