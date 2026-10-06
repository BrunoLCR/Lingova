# Manifiesto de archivos APF2 (rutas relativas a la raíz del proyecto)

| Estado | Ruta | Descripción |
|---|---|---|
| NUEVO | `.github/workflows/ci.yml` | CI: pruebas backend y build frontend |
| NUEVO | `MANIFIESTO_APF2.md` |  |
| MODIFICADO | `README.md` | Instrucciones actualizadas |
| MODIFICADO | `backend/.env.example` | Variables nuevas (Zoom, CORS múltiple) |
| MODIFICADO | `backend/package.json` | Añade helmet, express-rate-limit y script de pruebas |
| NUEVO | `backend/src/app.js` | Fábrica de la app Express: seguridad, rutas, manejo de errores |
| NUEVO | `backend/src/config/env.js` | Variables de entorno y modo Zoom |
| NUEVO | `backend/src/controllers/auditController.js` | Consulta y verificación de la cadena SHA-256 |
| NUEVO | `backend/src/controllers/dashboardController.js` | Dashboards por rol (código de APF1 movido + Marketing/Empresa) |
| NUEVO | `backend/src/controllers/paymentController.js` | Pagos a docentes + comprobantes (Storage) + estados |
| NUEVO | `backend/src/controllers/tarifaController.js` | Tarifas por hora de docentes |
| NUEVO | `backend/src/controllers/zoomController.js` | Clases Zoom: programar, listar, anfitrión, estados |
| NUEVO | `backend/src/middleware/auth.js` | Autenticación JWT + RBAC por rol y por permiso + auditoría de denegaciones |
| NUEVO | `backend/src/middleware/security.js` | Helmet, CORS, rate limiting |
| NUEVO | `backend/src/routes/index.js` | Rutas /api con guardas RBAC |
| MODIFICADO | `backend/src/server.js` | Punto de entrada (ahora delgado) |
| NUEVO | `backend/src/services/auditService.js` | Registro de eventos vía registrar_evento() |
| NUEVO | `backend/src/services/zoomService.js` | Cliente Zoom (OAuth S2S) y modo simulado |
| NUEVO | `backend/src/utils/httpError.js` | Validadores, sanitización y errores HTTP |
| NUEVO | `backend/src/utils/sanitize.js` | Validadores, sanitización y errores HTTP |
| NUEVO | `backend/src/utils/validators.js` | Validadores, sanitización y errores HTTP |
| NUEVO | `backend/tests/auth_rbac.test.js` | Pruebas automáticas del backend (40 pruebas) |
| NUEVO | `backend/tests/helpers/fakeSupabase.js` | Pruebas automáticas del backend (40 pruebas) |
| NUEVO | `backend/tests/helpers/testApp.js` | Pruebas automáticas del backend (40 pruebas) |
| NUEVO | `backend/tests/pagos.test.js` | Pruebas automáticas del backend (40 pruebas) |
| NUEVO | `backend/tests/tarifas.test.js` | Pruebas automáticas del backend (40 pruebas) |
| NUEVO | `backend/tests/zoom.test.js` | Pruebas automáticas del backend (40 pruebas) |
| MODIFICADO | `database/demo-data.sql` | Datos demo: empresa, usuarios Marketing/Empresa, pago, clase Zoom |
| NUEVO | `database/rbac_matrix.json` | Matriz rol→permiso (fuente única para SQL y pruebas) |
| MODIFICADO | `database/schema.sql` | Esquema completo: RBAC (roles/permisos), empresas, pagos, tarifas_docentes, clases_zoom, eventos_auditoria SHA-256, RLS, Storage |
| NUEVO | `database/tests/00_supabase_stub.sql` | Pruebas SQL sobre PostgreSQL local (65 pruebas) |
| NUEVO | `database/tests/resultados_sql.json` | Pruebas SQL sobre PostgreSQL local (65 pruebas) |
| NUEVO | `database/tests/run_sql_tests.py` | Pruebas SQL sobre PostgreSQL local (65 pruebas) |
| MODIFICADO | `frontend/src/App.jsx` | Enrutamiento por los 5 roles |
| NUEVO | `frontend/src/components/AuditoriaPanel.jsx` | Vista de auditoría + verificar integridad |
| NUEVO | `frontend/src/components/PagosPanel.jsx` | Vista de pagos + subida de comprobantes |
| NUEVO | `frontend/src/components/TarifasPanel.jsx` | Vista de tarifas por hora |
| NUEVO | `frontend/src/components/ZoomPanel.jsx` | Vista de clases Zoom |
| NUEVO | `frontend/src/components/ui.jsx` | Componentes UI compartidos |
| MODIFICADO | `frontend/src/lib/api.js` | Cliente API: manejo de 401 y helpers POST/PATCH |
| MODIFICADO | `frontend/src/pages/Administrador.jsx` | Integra los nuevos paneles |
| NUEVO | `frontend/src/pages/Empresa.jsx` | Nuevas vistas para los roles Marketing y Empresa |
| MODIFICADO | `frontend/src/pages/Login.jsx` | Integra los nuevos paneles |
| NUEVO | `frontend/src/pages/Marketing.jsx` | Nuevas vistas para los roles Marketing y Empresa |
| MODIFICADO | `frontend/src/pages/Profesor.jsx` | Integra los nuevos paneles |
| NUEVO | `frontend/vercel.json` | Rewrites SPA y cabeceras de seguridad |
| NUEVO | `render.yaml` | Blueprint de despliegue en Render |
