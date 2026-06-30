-- 004_admins_roles.sql — perfiles con roles para el panel admin.
-- Agrega rol (owner/editor), nombre visible y bandera de activo.
-- Los admins existentes se promueven a 'owner' para que no pierdan acceso.
--
-- Aplicar en Hostinger vía phpMyAdmin → pestaña SQL.
-- Idempotencia: si una columna ya existe, MySQL lanzará error 1060;
-- en ese caso omite esa línea y continúa con las demás.

ALTER TABLE admins
  ADD COLUMN role   VARCHAR(20)  NOT NULL DEFAULT 'editor' AFTER email,
  ADD COLUMN nombre VARCHAR(150) NOT NULL DEFAULT ''       AFTER role,
  ADD COLUMN activo TINYINT(1)   NOT NULL DEFAULT 1        AFTER password_hash;

-- Promover a todos los admins existentes a dueños.
UPDATE admins SET role = 'owner' WHERE role = 'editor';
