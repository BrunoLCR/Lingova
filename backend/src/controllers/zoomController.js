import { badRequest, forbidden, notFound } from '../utils/httpError.js'
import { validarClaseZoom, validarCambioEstadoClase, parseIdParam } from '../utils/validators.js'
import { crearReunionZoom, cancelarReunionZoom } from '../services/zoomService.js'
import { registrarEvento } from '../services/auditService.js'

// Columnas legibles por cualquier usuario autorizado. zoom_start_url NO se incluye nunca aquí.
const CLASE_COLS = 'id, curso_id, docente_id, titulo, descripcion, zoom_meeting_id, zoom_join_url, fecha_inicio, duracion_minutos, estado, simulado, created_at, updated_at'

export function createZoomController({ zoomConfig, zoomClient = { crear: crearReunionZoom, cancelar: cancelarReunionZoom } }) {
  async function listarClases(req, res) {
    let q = req.supabase.from('clases_zoom').select(`${CLASE_COLS}, curso:courses(name)`).order('fecha_inicio', { ascending: true }).limit(100)
    if (req.query.curso_id) q = q.eq('curso_id', parseIdParam(req.query.curso_id, 'curso_id'))
    if (req.query.desde === 'hoy') q = q.gte('fecha_inicio', new Date().toISOString())
    const { data, error } = await q
    if (error) throw error
    const esAnfitrion = ['PROFESOR', 'ADMINISTRADOR'].includes(req.profile.role)
    res.json({
      puede_programar: esAnfitrion,
      clases: (data || []).map(({ curso, ...c }) => ({ ...c, curso_nombre: curso?.name || null }))
    })
  }

  async function programarClase(req, res) {
    const input = validarClaseZoom(req.body)
    const { data: curso, error: cErr } = await req.supabase.from('courses').select('id, name, teacher_id, status').eq('id', input.curso_id).maybeSingle()
    if (cErr) throw cErr
    if (!curso) throw notFound('Curso no encontrado.')
    if (curso.status !== 'ACTIVO') throw badRequest('El curso está inactivo.')
    let docenteId = curso.teacher_id
    if (req.profile.role === 'PROFESOR') {
      const { data: asig, error: aErr } = await req.supabase.from('cursos_docentes').select('curso_id').eq('curso_id', curso.id).eq('docente_id', req.user.id).maybeSingle()
      if (aErr) throw aErr
      if (!asig) throw forbidden('Solo puedes programar clases de tus propios cursos.')
      docenteId = req.user.id
    }
    if (!docenteId) throw badRequest('El curso no tiene docente asignado.')

    const zoom = await zoomClient.crear({ titulo: input.titulo, descripcion: input.descripcion, fechaInicioISO: input.fecha_inicio, duracionMinutos: input.duracion_minutos }, zoomConfig)

    const row = {
      curso_id: input.curso_id,
      docente_id: docenteId,
      titulo: input.titulo,
      descripcion: input.descripcion,
      fecha_inicio: input.fecha_inicio,
      duracion_minutos: input.duracion_minutos,
      zoom_meeting_id: zoom.meetingId,
      zoom_join_url: zoom.joinUrl,
      zoom_start_url: zoom.startUrl,
      simulado: zoom.simulado,
      estado: 'PROGRAMADA'
    }
    const { data, error } = await req.supabase.from('clases_zoom').insert(row).select(CLASE_COLS).single()
    if (error) {
      // Compensación: no dejar reuniones huérfanas en Zoom si falla la BD
      await zoomClient.cancelar(zoom.meetingId, zoomConfig).catch(() => {})
      throw error
    }
    // El enlace de anfitrión se entrega solo al creador en esta respuesta
    res.status(201).json({ ...data, curso_nombre: curso.name, zoom_start_url: zoom.startUrl })
  }

  async function obtenerEnlaceAnfitrion(req, res) {
    const id = parseIdParam(req.params.id)
    const { data, error } = await req.supabase.rpc('clase_zoom_start_url', { p_clase_id: id })
    if (error) throw error
    if (!data) throw forbidden('No eres el anfitrión de esta clase.')
    await registrarEvento(req.supabase, { tipo: 'ZOOM_START_URL_CONSULTADA', entidad: 'clases_zoom', entidadId: id })
    res.json({ zoom_start_url: data })
  }

  async function cambiarEstadoClase(req, res) {
    const id = parseIdParam(req.params.id)
    const { data: clase, error: e1 } = await req.supabase.from('clases_zoom').select('id, estado, docente_id, zoom_meeting_id').eq('id', id).maybeSingle()
    if (e1) throw e1
    if (!clase) throw notFound('Clase no encontrada.')
    if (req.profile.role !== 'ADMINISTRADOR' && clase.docente_id !== req.user.id) throw forbidden('Solo el docente anfitrión puede modificar la clase.')

    const estado = validarCambioEstadoClase(req.body, clase.estado)
    if (estado === 'CANCELADA') await zoomClient.cancelar(clase.zoom_meeting_id, zoomConfig)

    const { data, error } = await req.supabase.from('clases_zoom').update({ estado }).eq('id', id).select(CLASE_COLS).single()
    if (error) throw error
    res.json(data)
  }

  return { listarClases, programarClase, obtenerEnlaceAnfitrion, cambiarEstadoClase }
}
