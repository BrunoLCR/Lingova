import { cleanText } from '../utils/sanitize.js'
import { badRequest } from '../utils/httpError.js'

export async function me(req, res) {
  res.json({ ...req.profile, permisos: req.permisos })
}

export async function updateStudentProfile(req, res) {
  const full_name = cleanText(req.body.full_name, 100)
  const phone = cleanText(req.body.phone, 20)
  if (full_name.length < 3) throw badRequest('Ingresa un nombre válido.')
  if (phone && !/^[0-9+()\- ]{6,20}$/.test(phone)) throw badRequest('El teléfono contiene caracteres no válidos.')

  const { data, error } = await req.supabase.from('profiles').update({ full_name, phone }).eq('id', req.user.id).select('id, full_name, email, role, status, phone, created_at').single()
  if (error) throw error
  res.json(data)
}

export async function professorDashboard(req, res) {
  const supabase = req.supabase
  // Cursos que el docente dicta (tabla cursos_docentes; un curso puede tener varios docentes)
  const { data: asignaciones, error: asigError } = await supabase.from('cursos_docentes').select('curso_id').eq('docente_id', req.user.id)
  if (asigError) throw asigError
  const asignIds = (asignaciones || []).map(a => a.curso_id)
  let courses = []
  if (asignIds.length) {
    const cr = await supabase.from('courses').select('id, name, level, description, status').in('id', asignIds).eq('status', 'ACTIVO').order('name')
    if (cr.error) throw cr.error
    courses = cr.data || []
  }
  const courseIds = (courses || []).map(c => c.id)

  let enrollments = [], profiles = [], sessions = [], assessments = []
  if (courseIds.length) {
    const enrollmentResult = await supabase.from('enrollments').select('student_id, course_id, progress, status').in('course_id', courseIds).eq('status', 'ACTIVA')
    if (enrollmentResult.error) throw enrollmentResult.error
    enrollments = enrollmentResult.data || []

    const studentIds = [...new Set(enrollments.map(e => e.student_id))]
    if (studentIds.length) {
      const profileResult = await supabase.from('profiles').select('id, full_name, email').in('id', studentIds)
      if (profileResult.error) throw profileResult.error
      profiles = profileResult.data || []
    }

    // Las clases en vivo ahora provienen de clases_zoom (APF2)
    const sessionResult = await supabase.from('clases_zoom').select('id, curso_id, titulo, fecha_inicio, zoom_join_url, estado').in('curso_id', courseIds).eq('estado', 'PROGRAMADA').gte('fecha_inicio', new Date().toISOString()).order('fecha_inicio').limit(10)
    if (sessionResult.error) throw sessionResult.error
    sessions = (sessionResult.data || []).map(s => ({ id: s.id, course_id: s.curso_id, title: s.titulo, starts_at: s.fecha_inicio, meeting_url: s.zoom_join_url, status: s.estado }))

    const assessmentResult = await supabase.from('assessments').select('id, course_id, title, due_at, max_score').in('course_id', courseIds).order('due_at')
    if (assessmentResult.error) throw assessmentResult.error
    assessments = assessmentResult.data || []
  }

  const students = enrollments.map(e => ({ ...e, student_name: profiles.find(p => p.id === e.student_id)?.full_name || 'Estudiante', course_name: courses.find(c => c.id === e.course_id)?.name || 'Curso' }))
  const enrichedCourses = (courses || []).map(c => ({ ...c, student_count: enrollments.filter(e => e.course_id === c.id).length }))
  const enrichedSessions = sessions.map(s => ({ ...s, course_name: courses.find(c => c.id === s.course_id)?.name || 'Curso' }))
  const enrichedAssessments = assessments.map(a => ({ ...a, course_name: courses.find(c => c.id === a.course_id)?.name || 'Curso' }))
  const averageProgress = students.length ? students.reduce((sum, s) => sum + Number(s.progress || 0), 0) / students.length : 0

  res.json({ profile: req.profile, courses: enrichedCourses, students, sessions: enrichedSessions, assessments: enrichedAssessments, average_progress: averageProgress })
}

export async function adminDashboard(req, res) {
  const supabase = req.supabase
  const [profilesR, coursesR, enrollmentsR, auditR, auditCountR, pagosR, empresasR] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, status, empresa_id, created_at').order('created_at', { ascending: false }),
    supabase.from('courses').select('id, name, level, status, teacher_id, created_at').order('created_at', { ascending: false }),
    supabase.from('enrollments').select('id, student_id, course_id, progress, status, enrolled_at').order('enrolled_at', { ascending: false }),
    supabase.from('eventos_auditoria').select('id, tipo_evento, descripcion, rol_usuario, hash_integridad, created_at').order('id', { ascending: false }).limit(20),
    supabase.from('eventos_auditoria').select('id', { count: 'exact', head: true }),
    supabase.from('pagos').select('id, estado, monto, moneda'),
    supabase.from('empresas').select('id, razon_social, ruc, estado').order('razon_social')
  ])
  for (const result of [profilesR, coursesR, enrollmentsR, auditR, pagosR, empresasR]) if (result.error) throw result.error

  const profiles = profilesR.data || []
  const courses = (coursesR.data || []).map(c => ({ ...c, teacher: profiles.find(p => p.id === c.teacher_id)?.full_name || null }))
  const enrollments = (enrollmentsR.data || []).map(e => ({ ...e, student_name: profiles.find(p => p.id === e.student_id)?.full_name || 'Estudiante', course_name: courses.find(c => c.id === e.course_id)?.name || 'Curso' }))
  const pagos = pagosR.data || []

  res.json({
    profile: req.profile,
    counts: {
      users: profiles.length,
      courses: courses.filter(c => c.status === 'ACTIVO').length,
      enrollments: enrollments.filter(e => e.status === 'ACTIVA').length,
      audit: auditCountR.count ?? (auditR.data?.length || 0),
      pagos_pendientes: pagos.filter(p => p.estado === 'PENDIENTE').length,
      empresas: (empresasR.data || []).length
    },
    users: profiles.slice(0, 30),
    courses,
    enrollments: enrollments.slice(0, 50),
    empresas: empresasR.data || [],
    audit: auditR.data || []
  })
}

export async function marketingDashboard(req, res) {
  const { data, error } = await req.supabase.from('publicaciones_instagram').select('id, titulo, contenido, programada_para, estado, created_at').order('created_at', { ascending: false }).limit(30)
  if (error) throw error
  const posts = data || []
  res.json({
    profile: req.profile,
    counts: {
      total: posts.length,
      programadas: posts.filter(p => p.estado === 'PROGRAMADA').length,
      publicadas: posts.filter(p => p.estado === 'PUBLICADA').length
    },
    posts
  })
}

export async function empresaDashboard(req, res) {
  const empresaId = req.profile.empresa_id
  const [empresaR, personalR, pagosR] = await Promise.all([
    req.supabase.from('empresas').select('id, razon_social, ruc, contacto_email, estado').eq('id', empresaId).maybeSingle(),
    req.supabase.from('profiles').select('id, full_name, email, role, status').eq('empresa_id', empresaId).eq('role', 'ESTUDIANTE'),
    req.supabase.from('pagos').select('id, estado, monto, moneda').eq('empresa_id', empresaId)
  ])
  for (const r of [empresaR, personalR, pagosR]) if (r.error) throw r.error

  const personal = personalR.data || []
  let matriculas = []
  if (personal.length) {
    const m = await req.supabase.from('enrollments').select('student_id, course_id, progress, status').in('student_id', personal.map(p => p.id))
    if (m.error) throw m.error
    matriculas = m.data || []
  }
  const avance = personal.map(p => {
    const mine = matriculas.filter(m => m.student_id === p.id && m.status !== 'RETIRADA')
    const prom = mine.length ? mine.reduce((s, m) => s + Number(m.progress || 0), 0) / mine.length : 0
    return { ...p, cursos: mine.length, progreso_promedio: Math.round(prom) }
  })
  res.json({ profile: req.profile, empresa: empresaR.data, personal: avance, pagos_pendientes: (pagosR.data || []).filter(p => p.estado === 'PENDIENTE').length })
}
