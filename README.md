# Lingova – Plataforma E-Learning de Inglés (APF2)

## Tecnologías
- Frontend: React + Tailwind CSS + Vite (despliegue en Vercel)
- Backend: Node.js + Express 5 (despliegue en Render)
- Base de datos: PostgreSQL en Supabase (Auth, RLS, Storage)
- Videoclases: Zoom (Server-to-Server OAuth; modo simulado si no hay credenciales)

## Roles (RBAC en API + RLS en BD)
ESTUDIANTE · PROFESOR · ADMINISTRADOR · MARKETING · EMPRESA

## Novedades APF2
- `database/schema.sql` (idempotente): 5 roles, `empresas`, `pagos`, `clases_zoom`, `eventos_auditoria` (SHA-256 encadenado, append-only), bucket privado `comprobantes-pagos`.
- Backend modular: `src/{config,middleware,controllers,routes,services,utils}`.
- Endpoints nuevos: `/api/pagos*`, `/api/clases-zoom*`, `/api/admin/auditoria*`, `/api/marketing/dashboard`, `/api/empresa/dashboard`.
- Pruebas: `backend` → `npm test` (49 pruebas) · `database/tests/run_sql_tests.py` (82 pruebas SQL).

## Puesta en marcha
1. Supabase → SQL Editor: ejecutar `database/schema.sql` y luego `database/demo-data.sql`.
2. Supabase → Authentication → crear usuarios (clave `Demo123!`):
   `estudiante@`, `profesor@`, `admin@`, `marketing@`, `empresa@` + `lingova.pe`.
3. Copiar `backend/.env.example` → `backend/.env` y `frontend/.env.example` → `frontend/.env` y completar valores.
4. Backend: `cd backend && npm install && npm run dev` (puerto 3001)
5. Frontend: `cd frontend && npm install && npm run dev` (puerto 4200)

> **Nunca subas los `.env` a GitHub.** Si alguna clave se expuso, regénérala en Supabase.


## Flujo del estudiante (matrícula autogestionada)
1. El estudiante nuevo entra **sin cursos**: el panel muestra la tarjeta *"Aún no tienes cursos"* con el botón **+ Agregar Curso**. Clases, Notas y Certificados aparecen con candado.
2. El modal guía: **curso → docente → pago simulado → confirmación**. No se cobra nada ni se piden datos de tarjeta.
3. El backend llama a `matricular_estudiante()` (SQL), que valida curso, docente y método, **inserta en `enrollments`** (vista alias `public.matriculas`), guarda la referencia `SIM-…` y audita el evento.
4. El panel se recarga y se habilitan **Clases en vivo, Notas y Certificados** (elegibilidad: progreso 100 % y promedio ≥ 11/20; la emisión del PDF llega en el Sprint 5).

Endpoints: `GET /api/student/dashboard`, `GET /api/student/catalogo`, `POST /api/student/matricular`, `GET /api/student/notas`.
Para probar la elección de docente, crea también `profesor2@lingova.pe` en Authentication antes de ejecutar `demo-data.sql`.
Pruebas: backend 49 · SQL 82.

## Pruebas
```bash
cd backend && npm test
pip install pgserver psycopg2-binary && python database/tests/run_sql_tests.py
```

## Despliegue (Render + Supabase)
- `render.yaml` define dos servicios: `lingova-app` (frontend estático, https://lingova-app.onrender.com) y `lingova-api` (backend, health check `/api/health`).
- Variables sensibles se configuran en el panel de Render (nunca en Git). `FRONTEND_URL` del backend debe coincidir con la URL del frontend (CORS).
