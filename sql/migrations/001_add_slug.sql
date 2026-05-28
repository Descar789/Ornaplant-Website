SET NAMES utf8mb4;
ALTER TABLE plantas ADD COLUMN slug VARCHAR(180) NULL AFTER nombre;
-- Rollback:
-- ALTER TABLE plantas DROP COLUMN slug;
