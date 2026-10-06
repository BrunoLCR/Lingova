-- ============================================================
-- Catálogo base de 6 cursos (coincide con la Landing: frontend/src/data/cursosCatalogo.js)
-- Idempotente. Ejecutar DESPUÉS de schema.sql.
-- Precio: Business English Pro = S/ 119.50. Los demás usan el valor por defecto (119.50);
-- ajústalos con:  update public.courses set precio = ... where name = '...';
-- ============================================================
insert into public.courses (name, level, description, status, precio)
select v.name, v.level, v.description, 'ACTIVO', v.precio
from (values
  ('Inglés Básico', 'A1-A2', 'Base del idioma: vocabulario esencial, gramática inicial y primeras conversaciones.', 119.50),
  ('Inglés Intermedio', 'B1-B2', 'Fluidez para viajar, trabajar y conversar con seguridad.', 119.50),
  ('Inglés Avanzado', 'C1', 'Precisión, vocabulario y comprensión en contextos académicos y profesionales.', 119.50),
  ('Business English Pro', 'B2', 'Reuniones, presentaciones, correos y negociaciones. Certificación reconocida.', 119.50),
  ('Preparación TOEFL / IELTS Ready', 'B2-C1', 'Estrategias, simulacros y práctica de las cuatro habilidades.', 119.50),
  ('English for Tech', 'B1-B2', 'Inglés para equipos de tecnología: dailies, documentación, code reviews y entrevistas.', 119.50)
) as v(name, level, description, precio)
where not exists (select 1 from public.courses c where c.name = v.name);

-- Para la demo: todos los docentes ACTIVOS dictan los 6 cursos (así aparecen en "Agregar curso").
-- En producción, asigna docentes por curso en public.cursos_docentes.
insert into public.cursos_docentes (curso_id, docente_id)
select c.id, p.id
from public.courses c cross join public.profiles p
where p.role = 'PROFESOR' and p.status = 'ACTIVO'
  and c.name in ('Inglés Básico','Inglés Intermedio','Inglés Avanzado','Business English Pro','Preparación TOEFL / IELTS Ready','English for Tech')
on conflict do nothing;
