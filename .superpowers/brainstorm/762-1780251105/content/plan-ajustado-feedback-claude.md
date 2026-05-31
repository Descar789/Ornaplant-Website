# Plan ajustado tras feedback de Claude

El plan anterior iba en buena direccion, pero tenia demasiado peso para el
tamano real del panel. Se ajusto asi:

- Reducir la arquitectura a `main.js`, `state.js`, `ui.js` y `actions.js`.
- Mantener `api.js` como unica capa HTTP.
- Mover a Fase 1 los bugs reales detectados:
  - crear/editar deben ser rutas explicitas;
  - el backend debe generar el ID al crear;
  - `isAdminLogged()` debe considerar `exp`;
  - `accessDenied` y `adminAvatar` son UI muerta si no se usan;
  - `cuidado` debe normalizarse a `intermedio`.
- Mantener render seguro con DOM APIs desde el primer refactor.
- Convertir multi-imagen en una fase posterior con decision previa de politica
  de archivos.
- Convertir logs, soft delete, papelera y dashboard en futuro opcional.

Fuente canonica actual:

`docs/superpowers/plans/2026-05-31--admin-panel-refactor.md`
