SET NAMES utf8mb4;
CREATE UNIQUE INDEX uk_plantas_slug ON plantas (slug);
-- Rollback:
-- DROP INDEX uk_plantas_slug ON plantas;
