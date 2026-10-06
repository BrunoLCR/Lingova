import { badRequest } from '../utils/httpError.js'
import { isUuid, toPositiveInt } from '../utils/sanitize.js'

export const METODOS_SIMULADOS = ['TARJETA', 'YAPE', 'PLIN']
const APROBATORIA = 11 // escala vigesimal peruana

// Panel del estudiante: solo matrículas ACTIVAS. Sin matrículas => tiene_cursos = false.
export async function studentDashboard(req, res) {
  const sb = req.supabase
  const { data: enr, error } = await sb.from('enrollments')
    .select('id, course_id, docente_id, progress, status, enrolled_at, monto_pagado, pago_simulado_ref')
    .eq('student_id', req.user.id).eq('status', 'ACTIVA')
  if (error) throw error

  const matriculas = enr || []
  const courseIds = matriculas.map(e => e.course_id)
  let courses = []
  let sessions = []

  if (courseIds.length) {
    const { data: rows, error: cErr } = await sb.from('courses').select('id, name, level, description, status, teacher_id').in('id', courseIds)
    if (cErr) throw cErr
    const { data: docentes } = await sb.rpc('nombres_docentes_matricula')
    const nombres = docentes || []

    courses = (rows || []).map(c => {
      const e = matriculas.find(x => x.course_id === c.id)
      const docenteId = e?.docente_id || c.teacher_id
      return {
        ...c,
        matricula_id: e?.id,
        progress: Number(e?.progress || 0),
        docente_id: docenteId,
        teacher: nombres.find(d => d.id === docenteId)?.full_name || null,
        referencia_pago: e?.pago_simulado_ref || null,
        monto_pagado: e?.monto_pagado ?? null
      }
    })

    const { data: cl, error: sErr } = await sb.from('clases_zoom')
      .select('id, curso_id, docente_id, titulo, fecha_inicio, zoom_join_url, estado')
      .in('curso_id', courseIds).eq('estado', 'PROGRAMADA').gte('fecha_inicio', new Date().toISOString())
      .order('fecha_inicio', { ascending: true }).limit(20)
    if (sErr) throw sErr
    sessions = (cl || [])
      .filter(s => { const e = matriculas.find(x => x.course_id === s.curso_id); return !e?.docente_id || e.docente_id === s.docente_id })
      .map(s => ({ id: s.id, course_id: s.curso_id, title: s.titulo, starts_at: s.fecha_inicio, meeting_url: s.zoom_join_url, status: s.estado, course_name: courses.find(c => c.id === s.curso_id)?.name || 'Curso' }))
  }

  res.json({ profile: req.profile, tiene_cursos: courses.length > 0, courses, sessions })
}

// Catálogo agrupado por curso, con los docentes que lo dictan
export async function catalogo(req, res) {
  const { data, error } = await req.supabase.rpc('catalogo_cursos')
  if (error) throw error
  const porCurso = new Map()
  for (const r of data || []) {
    if (!porCurso.has(r.curso_id)) porCurso.set(r.curso_id, { id: r.curso_id, nombre: r.nombre, nivel: r.nivel, descripcion: r.descripcion, precio: Number(r.precio), ya_matriculado: r.ya_matriculado, docentes: [] })
    porCurso.get(r.curso_id).docentes.push({ id: r.docente_id, nombre: r.docente_nombre })
  }
  res.json({ cursos: [...porCurso.values()], metodos_pago: METODOS_SIMULADOS, simulacion: true })
}

// Matrícula con pago SIMULADO: no se cobra ni se reciben datos de tarjeta.
export async function matricular(req, res) {
  const curso_id = toPositiveInt(req.body?.curso_id)
  const docente_id = String(req.body?.docente_id || '')
  const metodo = String(req.body?.metodo_pago || '').toUpperCase()
  const errors = []
  if (!curso_id) errors.push('Selecciona un curso válido.')
  if (!isUuid(docente_id)) errors.push('Selecciona un docente válido.')
  if (!METODOS_SIMULADOS.includes(metodo)) errors.push('Selecciona un método de pago válido.')
  if (errors.length) throw badRequest('Datos de matrícula inválidos.', errors)

  const { data, error } = await req.supabase.rpc('matricular_estudiante', { p_curso: curso_id, p_docente: docente_id, p_metodo: metodo })
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ya estás matriculado en este curso.' })
    if (error.code === '22023') throw badRequest(error.message)
    throw error
  }
  const r = Array.isArray(data) ? data[0] : data
  res.status(201).json({ matricula_id: r.matricula_id, referencia: r.referencia, monto: Number(r.monto), curso: r.curso, metodo_pago: metodo, simulado: true })
}

// Notas por curso y elegibilidad de certificado (solo cursos con matrícula activa)
export async function notas(req, res) {
  const sb = req.supabase
  const { data: enr, error } = await sb.from('enrollments').select('course_id, progress').eq('student_id', req.user.id).eq('status', 'ACTIVA')
  if (error) throw error
  const matriculas = enr || []
  if (!matriculas.length) return res.json({ cursos: [] })

  const courseIds = matriculas.map(e => e.course_id)
  const { data: courses, error: e1 } = await sb.from('courses').select('id, name, level').in('id', courseIds)
  if (e1) throw e1
  const { data: asses, error: e2 } = await sb.from('assessments').select('id, course_id, title, due_at, max_score').in('course_id', courseIds)
  if (e2) throw e2
  const ids = (asses || []).map(a => a.id)
  let scores = []
  if (ids.length) {
    const r = await sb.from('assessment_scores').select('assessment_id, score, submitted_at').eq('student_id', req.user.id).in('assessment_id', ids)
    if (r.error) throw r.error
    scores = r.data || []
  }

  const cursos = (courses || []).map(c => {
    const progreso = Number(matriculas.find(m => m.course_id === c.id)?.progress || 0)
    const evaluaciones = (asses || []).filter(a => a.course_id === c.id).map(a => {
      const sc = scores.find(s => s.assessment_id === a.id)
      const nota = sc && sc.score !== null && sc.score !== undefined ? Number(sc.score) : null
      return { id: a.id, titulo: a.title, fecha_limite: a.due_at, puntaje_max: Number(a.max_score), nota, calificada: nota !== null }
    })
    const calificadas = evaluaciones.filter(e => e.calificada)
    const promedio = calificadas.length ? Math.round((calificadas.reduce((s, e) => s + (e.nota / e.puntaje_max) * 20, 0) / calificadas.length) * 100) / 100 : null
    const elegible = progreso >= 100 && promedio !== null && promedio >= APROBATORIA
    return { curso_id: c.id, curso: c.name, nivel: c.level, progreso, evaluaciones, promedio, certificado: { elegible, estado: elegible ? 'ELEGIBLE' : 'EN_CURSO', requisitos: `Progreso 100 % y promedio mínimo ${APROBATORIA}/20`, emision: 'SPRINT_5' } }
  })
  res.json({ cursos })
}
