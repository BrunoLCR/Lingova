
-- Crear/actualizar perfiles vinculados a los usuarios de Supabase Auth.
insert into public.profiles (id, full_name, email, role, status)
select id, 'Alumno Demo', email, 'ESTUDIANTE', 'ACTIVO'
from auth.users where email = 'estudiante@lingova.pe'
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, role = excluded.role, status = excluded.status;

insert into public.profiles (id, full_name, email, role, status)
select id, 'Profesor Lingova', email, 'PROFESOR', 'ACTIVO'
from auth.users where email = 'profesor@lingova.pe'
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, role = excluded.role, status = excluded.status;

insert into public.profiles (id, full_name, email, role, status)
select id, 'Administrador Lingova', email, 'ADMINISTRADOR', 'ACTIVO'
from auth.users where email = 'admin@lingova.pe'
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, role = excluded.role, status = excluded.status;

-- Cursos de prueba (evita duplicarlos por nombre).
insert into public.courses (name, level, description, teacher_id, status)
select 'English A2 - General', 'A2', 'Curso enfocado en comunicación cotidiana y bases gramaticales.', p.id, 'ACTIVO'
from public.profiles p
where p.email = 'profesor@lingova.pe'
and not exists (select 1 from public.courses where name = 'English A2 - General');

insert into public.courses (name, level, description, teacher_id, status)
select 'Business English B1', 'B1', 'Inglés aplicado a reuniones, correos y situaciones laborales.', p.id, 'ACTIVO'
from public.profiles p
where p.email = 'profesor@lingova.pe'
and not exists (select 1 from public.courses where name = 'Business English B1');

insert into public.courses (name, level, description, teacher_id, status)
select 'TOEFL Preparation', 'B2', 'Preparación progresiva para comprensión, estructura y práctica tipo TOEFL.', p.id, 'ACTIVO'
from public.profiles p
where p.email = 'profesor@lingova.pe'
and not exists (select 1 from public.courses where name = 'TOEFL Preparation');

-- El alumno demo EMPIEZA SIN CURSOS: debe usar "+ Agregar curso" en su panel.
-- Docentes por curso (la función catalogo_cursos() lista un registro por curso y docente).
insert into public.cursos_docentes (curso_id, docente_id)
select id, teacher_id from public.courses where teacher_id is not null on conflict do nothing;

-- Opcional: crear en Authentication al usuario profesor2@lingova.pe para probar la elección de docente.
insert into public.profiles (id, full_name, email, role, status)
select id, 'Profesora Invitada', email, 'PROFESOR', 'ACTIVO' from auth.users where email = 'profesor2@lingova.pe'
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, status = excluded.status;
insert into public.cursos_docentes (curso_id, docente_id)
select c.id, p.id from public.courses c, public.profiles p
where p.email = 'profesor2@lingova.pe' and c.name in ('English A2 - General', 'TOEFL Preparation')
on conflict do nothing;

-- (APF1) Sesiones con enlace genérico; en APF2 las clases en vivo se gestionan en clases_zoom.
-- Próximas clases, solo si no existen.
insert into public.class_sessions (course_id, title, starts_at, meeting_url, status)
select c.id, 'Speaking practice: Daily routines', now() + interval '1 day', 'https://meet.google.com/', 'PROGRAMADA'
from public.courses c where c.name='English A2 - General'
and not exists (select 1 from public.class_sessions where title='Speaking practice: Daily routines');

insert into public.class_sessions (course_id, title, starts_at, meeting_url, status)
select c.id, 'Business meetings and vocabulary', now() + interval '3 days', 'https://meet.google.com/', 'PROGRAMADA'
from public.courses c where c.name='Business English B1'
and not exists (select 1 from public.class_sessions where title='Business meetings and vocabulary');

-- Evaluaciones.
insert into public.assessments (course_id, title, due_at, max_score)
select c.id, 'Quiz - Unit 3', now() + interval '5 days', 20
from public.courses c where c.name='English A2 - General'
and not exists (select 1 from public.assessments where title='Quiz - Unit 3');

insert into public.assessments (course_id, title, due_at, max_score)
select c.id, 'Business Email Assignment', now() + interval '7 days', 20
from public.courses c where c.name='Business English B1'
and not exists (select 1 from public.assessments where title='Business Email Assignment');

-- ============================================================
-- APF2: empresa cliente, usuarios MARKETING / EMPRESA, pagos y clases Zoom
-- Antes: crear en Supabase > Authentication > Users:
--   marketing@lingova.pe  y  empresa@lingova.pe   (clave Demo123!)
-- ============================================================
insert into public.empresas (razon_social, ruc, contacto_email)
select 'Acme Perú S.A.C.', '20123456789', 'rrhh@acme.pe'
where not exists (select 1 from public.empresas where ruc = '20123456789');

insert into public.profiles (id, full_name, email, role, status, empresa_id)
select u.id, 'Encargado de Marketing', u.email, 'MARKETING', 'ACTIVO', null
from auth.users u where u.email = 'marketing@lingova.pe'
on conflict (id) do update set role = 'MARKETING', status = 'ACTIVO';

insert into public.profiles (id, full_name, email, role, status, empresa_id)
select u.id, 'Representante Acme', u.email, 'EMPRESA', 'ACTIVO', e.id
from auth.users u, public.empresas e where u.email = 'empresa@lingova.pe' and e.ruc = '20123456789'
on conflict (id) do update set role = 'EMPRESA', status = 'ACTIVO', empresa_id = excluded.empresa_id;

-- El estudiante demo pertenece a la empresa cliente
update public.profiles set empresa_id = (select id from public.empresas where ruc = '20123456789')
where email = 'estudiante@lingova.pe';

-- Pago de ejemplo (pendiente, pagado por la administración)
insert into public.pagos (docente_id, pagador_tipo, concepto, periodo_inicio, periodo_fin, monto, moneda, metodo_pago, estado, registrado_por)
select d.id, 'ADMINISTRACION', 'Honorarios septiembre 2026', '2026-09-01', '2026-09-30', 1200.00, 'PEN', 'TRANSFERENCIA', 'PENDIENTE', a.id
from public.profiles d, public.profiles a
where d.email = 'profesor@lingova.pe' and a.email = 'admin@lingova.pe'
and not exists (select 1 from public.pagos where concepto = 'Honorarios septiembre 2026');

-- Clase Zoom de ejemplo (marcada como simulada: no existe en Zoom real)
insert into public.clases_zoom (curso_id, docente_id, titulo, descripcion, zoom_meeting_id, zoom_join_url, zoom_start_url, fecha_inicio, duracion_minutos, estado, simulado)
select c.id, c.teacher_id, 'Speaking practice: Daily routines', 'Sesión demostrativa', '81234567890',
       'https://zoom.us/j/81234567890?pwd=SIMULADO', 'https://zoom.us/s/81234567890?zak=SIMULADO',
       now() + interval '2 days', 60, 'PROGRAMADA', true
from public.courses c where c.name = 'English A2 - General'
and not exists (select 1 from public.clases_zoom where zoom_meeting_id = '81234567890');

-- Publicación de ejemplo para el rol MARKETING
insert into public.publicaciones_instagram (titulo, contenido, estado, creado_por)
select 'Promo 50% - Habla inglés con confianza', 'Campaña de lanzamiento', 'BORRADOR', p.id
from public.profiles p where p.email = 'marketing@lingova.pe'
and not exists (select 1 from public.publicaciones_instagram where titulo like 'Promo 50%');
