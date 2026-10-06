import { badRequest, forbidden, notFound } from '../utils/httpError.js'
import { validarPago, validarCambioEstadoPago, validarComprobante, parseIdParam, ESTADOS_PAGO } from '../utils/validators.js'
import { registrarEvento } from '../services/auditService.js'

const BUCKET = 'comprobantes-pagos'
const PAGO_COLS = 'id, docente_id, empresa_id, pagador_tipo, concepto, periodo_inicio, periodo_fin, monto, horas, tarifa_hora, moneda, metodo_pago, estado, referencia_operacion, fecha_pago, comprobante_path, comprobante_nombre, registrado_por, created_at, updated_at'

const withDocente = rows => rows.map(({ docente, ...r }) => ({ ...r, docente_nombre: docente?.full_name || null, tiene_comprobante: Boolean(r.comprobante_path) }))

export async function listarPagos(req, res) {
  const { estado, docente_id } = req.query
  let q = req.supabase
    .from('pagos')
    .select(`${PAGO_COLS}, docente:profiles!pagos_docente_id_fkey(full_name)`)
    .order('created_at', { ascending: false })
    .limit(200)
  if (estado) {
    if (!ESTADOS_PAGO.includes(String(estado).toUpperCase())) throw badRequest('Filtro de estado inválido.')
    q = q.eq('estado', String(estado).toUpperCase())
  }
  if (docente_id) q = q.eq('docente_id', String(docente_id))
  const { data, error } = await q
  if (error) throw error

  const pagos = withDocente(data || [])
  const vigentes = pagos.filter(p => p.estado !== 'ANULADO')
  const suma = estados => vigentes.filter(p => estados.includes(p.estado)).reduce((s, p) => s + Number(p.monto), 0)
  res.json({
    pagos,
    resumen: {
      total_registros: pagos.length,
      monto_pagado: suma(['PAGADO']),
      monto_pendiente: suma(['PENDIENTE']),
      monto_vencido: suma(['VENCIDO']),
      cantidad_pendientes: vigentes.filter(p => p.estado === 'PENDIENTE').length
    }
  })
}

export async function listarDocentes(req, res) {
  const { data, error } = await req.supabase.from('profiles').select('id, full_name, email').eq('role', 'PROFESOR').eq('status', 'ACTIVO').order('full_name')
  if (error) throw error
  res.json(data || [])
}

export async function crearPago(req, res) {
  const input = validarPago(req.body)
  const { profile } = req
  const row = { ...input, registrado_por: req.user.id }

  if (profile.role === 'EMPRESA') {
    // La empresa solo paga en su nombre y su pago queda PENDIENTE hasta verificación del administrador
    row.pagador_tipo = 'EMPRESA'
    row.empresa_id = profile.empresa_id
    row.estado = 'PENDIENTE'
    row.fecha_pago = null
  } else if (row.pagador_tipo === 'EMPRESA' && !row.empresa_id) {
    throw badRequest('Indica la empresa cliente que realiza el pago.')
  } else if (row.pagador_tipo === 'ADMINISTRACION') {
    row.empresa_id = null
  }

  const { data: docente, error: dErr } = await req.supabase.from('profiles').select('id, role, status').eq('id', row.docente_id).maybeSingle()
  if (dErr) throw dErr
  if (!docente || docente.role !== 'PROFESOR') throw badRequest('El beneficiario debe ser un docente registrado.')
  if (docente.status !== 'ACTIVO') throw badRequest('El docente está inactivo.')

  // Modalidad por horas: monto = horas × tarifa vigente del docente (calculado en servidor)
  if (row.horas !== null) {
    const { data: tarifa, error: tErr } = await req.supabase.from('tarifas_docentes').select('tarifa_hora').eq('docente_id', row.docente_id).eq('moneda', row.moneda).is('vigente_hasta', null).maybeSingle()
    if (tErr) throw tErr
    if (!tarifa) throw badRequest(`El docente no tiene una tarifa por hora vigente en ${row.moneda}.`)
    row.tarifa_hora = Number(tarifa.tarifa_hora)
    row.monto = Math.round(row.horas * row.tarifa_hora * 100) / 100
    if (row.monto > 100000) throw badRequest('El monto calculado excede el máximo permitido.')
  }

  const { data, error } = await req.supabase.from('pagos').insert(row).select(PAGO_COLS).single()
  if (error) throw error
  res.status(201).json({ ...data, tiene_comprobante: false })
}

export async function cambiarEstadoPago(req, res) {
  const id = parseIdParam(req.params.id)
  const { data: actual, error: e1 } = await req.supabase.from('pagos').select('id, estado, comprobante_path').eq('id', id).maybeSingle()
  if (e1) throw e1
  if (!actual) throw notFound('Pago no encontrado.')

  const cambio = validarCambioEstadoPago(req.body, actual.estado)
  if (cambio.estado === 'PAGADO' && !actual.comprobante_path) throw badRequest('Adjunta el comprobante antes de marcar el pago como PAGADO.')

  const patch = { estado: cambio.estado }
  if (cambio.estado === 'PAGADO') patch.fecha_pago = cambio.fecha_pago
  const { data, error } = await req.supabase.from('pagos').update(patch).eq('id', id).select(PAGO_COLS).single()
  if (error) throw error

  if (cambio.estado === 'ANULADO') {
    await registrarEvento(req.supabase, { tipo: 'PAGO_ANULADO_MOTIVO', entidad: 'pagos', entidadId: id, descripcion: cambio.motivo, datos: { estado_anterior: actual.estado } })
  }
  res.json(data)
}

export async function adjuntarComprobante(req, res) {
  const id = parseIdParam(req.params.id)
  const { path, nombre } = validarComprobante(req.body, id)

  // Verifica que el archivo realmente exista en Storage (subido con los permisos del usuario)
  const fileName = path.split('/').pop()
  const { data: files, error: lErr } = await req.supabase.storage.from(BUCKET).list(`pagos/${id}`, { search: fileName })
  if (lErr) throw lErr
  if (!files?.some(f => f.name === fileName)) throw badRequest('El archivo no existe en el almacenamiento. Súbelo primero.')

  const { error } = await req.supabase.rpc('adjuntar_comprobante', { p_pago_id: id, p_path: path, p_nombre: nombre })
  if (error) {
    if (error.code === '42501') throw forbidden('No puedes adjuntar comprobantes a este pago.')
    if (error.code === 'P0002') throw notFound('Pago no encontrado.')
    throw error
  }
  await registrarEvento(req.supabase, { tipo: 'COMPROBANTE_ADJUNTADO', entidad: 'pagos', entidadId: id, descripcion: `Comprobante ${nombre}`, datos: { path } })
  res.json({ ok: true, comprobante_path: path, comprobante_nombre: nombre })
}

export async function obtenerComprobante(req, res) {
  const id = parseIdParam(req.params.id)
  // RLS: solo devuelve el pago si el usuario es admin, el docente beneficiario o la empresa dueña
  const { data: pago, error } = await req.supabase.from('pagos').select('id, comprobante_path, comprobante_nombre').eq('id', id).maybeSingle()
  if (error) throw error
  if (!pago) throw notFound('Pago no encontrado.')
  if (!pago.comprobante_path) throw notFound('Este pago no tiene comprobante adjunto.')

  const { data, error: sErr } = await req.supabase.storage.from(BUCKET).createSignedUrl(pago.comprobante_path, 120)
  if (sErr) throw sErr
  await registrarEvento(req.supabase, { tipo: 'COMPROBANTE_CONSULTADO', entidad: 'pagos', entidadId: id, descripcion: 'URL firmada de 120 s generada' })
  res.json({ url: data.signedUrl, nombre: pago.comprobante_nombre, expira_en_segundos: 120 })
}
