-- Normaliza valor 'intermedia' a 'intermedio' en campo cuidado.
-- Ejecutar una sola vez en produccion antes de desplegar Fase 1.
UPDATE plantas SET cuidado = 'intermedio' WHERE cuidado = 'intermedia';
