import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAll, USERS } from './helpers/fakeSupabase.js'
import { startApp } from './helpers/testApp.js'

const CATALOGO = [
  { curso_id: 1, nombre: 'English A2', nivel: 'A2', descripcion: 'x', precio: '119.50', docente_id: USERS.prof.id, docente_nombre: 'PROF', ya_matriculado: false },
  { curso_id: 2, nombre: 'TOEFL', nivel: 'B2', descripcion: 'y', precio: '150.00', docente_id: USERS.prof2.id, docente_nombre: 'PROF2', ya_matriculado: false },
  { curso_id: 2, nombre: 'TOEFL', nivel: 'B2', descripcion: 'y', precio: '150.00', docente_id: USERS.prof.id, docente_nombre: 'PROF', ya_matriculado: false }
]

test('CP09 Matrícula autogestionada del estudiante (enrollments)', async t => {
  const { db, factory } = seedAll({ rpcHandlers: {
    catalogo_cursos: () => ({ data: CATALOGO, error: null }),
    nombres_docentes_matricula: () => ({ data: [{ id: USERS.prof.id, full_name: 'PROF' }], error: null }),
    matricular_estudiante: a => {
      if (db.tables.enrollments.some(e => e.student_id === USERS.est.id && e.course_id === a.p_curso && e.status === 'ACTIVA')) return { data: null, error: { code: '23505', message: 'dup' } }
      if (a.p_docente === USERS.mkt.id) return { data: null, error: { code: '22023', message: 'El docente no dicta este curso' } }
      db.tables.enrollments.push({ id: db.nextId++, student_id: USERS.est.id, course_id: a.p_curso, docente_id: a.p_docente, progress: 0, status: 'ACTIVA' })
      return { data: [{ matricula_id: db.nextId - 1, referencia: 'SIM-ABC1234567', monto: '119.50', curso: 'English A2' }], error: null }
    }
  } })
  const app = await startApp({ factory }); t.after(app.close)
  const est = USERS.est.token

  await t.test('estado inicial: sin matrículas → tiene_cursos = false', async () => {
    const r = await app.call('GET', '/api/student/dashboard', { token: est })
    assert.equal(r.status, 200); assert.equal(r.body.tiene_cursos, false); assert.deepEqual(r.body.courses, [])
  })
  await t.test('notas sin matrículas → lista vacía', async () => {
    const r = await app.call('GET', '/api/student/notas', { token: est })
    assert.equal(r.status, 200); assert.deepEqual(r.body.cursos, [])
  })
  await t.test('catálogo agrupado por curso con sus docentes; solo el rol estudiante', async () => {
    const r = await app.call('GET', '/api/student/catalogo', { token: est })
    assert.equal(r.status, 200); assert.equal(r.body.cursos.length, 2)
    assert.equal(r.body.cursos.find(c => c.id === 2).docentes.length, 2); assert.equal(r.body.simulacion, true)
    for (const u of ['prof', 'admin', 'emp', 'mkt']) assert.equal((await app.call('GET', '/api/student/catalogo', { token: USERS[u].token })).status, 403, u)
    for (const u of ['prof', 'admin', 'emp', 'mkt']) assert.equal((await app.call('POST', '/api/student/matricular', { token: USERS[u].token, body: {} })).status, 403, u)
  })
  await t.test('validaciones: curso, docente y método de pago', async () => {
    const antes = db.rpcCalls.filter(c => c.name === 'matricular_estudiante').length
    for (const body of [{}, { curso_id: 'x', docente_id: USERS.prof.id, metodo_pago: 'YAPE' }, { curso_id: 1, docente_id: 'no-uuid', metodo_pago: 'YAPE' }, { curso_id: 1, docente_id: USERS.prof.id, metodo_pago: 'BITCOIN' }, { curso_id: -1, docente_id: USERS.prof.id, metodo_pago: 'PLIN' }])
      assert.equal((await app.call('POST', '/api/student/matricular', { token: est, body })).status, 400, JSON.stringify(body))
    assert.equal(db.rpcCalls.filter(c => c.name === 'matricular_estudiante').length, antes, 'no debe llamar a la BD con datos inválidos')
  })
  await t.test('matrícula con pago simulado → 201 e inserta en enrollments', async () => {
    const r = await app.call('POST', '/api/student/matricular', { token: est, body: { curso_id: 1, docente_id: USERS.prof.id, metodo_pago: 'yape' } })
    assert.equal(r.status, 201); assert.match(r.body.referencia, /^SIM-/); assert.equal(r.body.simulado, true); assert.equal(r.body.monto, 119.5)
    assert.equal(db.rpcCalls.at(-1).args.p_metodo, 'YAPE')
    assert.equal(db.tables.enrollments.length, 1)
  })
  await t.test('matrícula duplicada → 409; docente que no dicta el curso → 400', async () => {
    assert.equal((await app.call('POST', '/api/student/matricular', { token: est, body: { curso_id: 1, docente_id: USERS.prof.id, metodo_pago: 'YAPE' } })).status, 409)
    assert.equal((await app.call('POST', '/api/student/matricular', { token: est, body: { curso_id: 2, docente_id: USERS.mkt.id, metodo_pago: 'YAPE' } })).status, 400)
  })
  await t.test('tras matricularse el panel habilita cursos con docente y progreso', async () => {
    db.tables.courses[0].level = 'A2'
    const r = await app.call('GET', '/api/student/dashboard', { token: est })
    assert.equal(r.body.tiene_cursos, true); assert.equal(r.body.courses.length, 1); assert.equal(r.body.courses[0].teacher, 'PROF')
  })
  await t.test('notas y elegibilidad de certificado (promedio ≥ 11 y progreso 100 %)', async () => {
    db.tables.enrollments[0].progress = 100
    db.tables.assessments = [{ id: 1, course_id: 1, title: 'Quiz 1', max_score: 20 }, { id: 2, course_id: 1, title: 'Final', max_score: 20 }]
    db.tables.assessment_scores = [{ assessment_id: 1, student_id: USERS.est.id, score: 14 }, { assessment_id: 2, student_id: USERS.est.id, score: 18 }]
    let r = await app.call('GET', '/api/student/notas', { token: est })
    assert.equal(r.body.cursos[0].promedio, 16); assert.equal(r.body.cursos[0].certificado.elegible, true)
    db.tables.assessment_scores[0].score = 3; db.tables.assessment_scores[1].score = 8
    r = await app.call('GET', '/api/student/notas', { token: est })
    assert.equal(r.body.cursos[0].certificado.elegible, false)
  })
})
