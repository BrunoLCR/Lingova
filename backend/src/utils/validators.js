import { badRequest } from './httpError.js'
import { cleanText, isUuid, toPositiveInt } from './sanitize.js'

export const METODOS_PAGO = ['TRANSFERENCIA', 'DEPOSITO', 'YAPE', 'PLIN', 'EFECTIVO', 'TARJETA']
export const ESTADOS_PAGO = ['PENDIENTE', 'PAGADO', 'VENCIDO', 'ANULADO']
export const MONEDAS = ['PEN', 'USD']
export const ESTADOS_CLASE = ['PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA']

// Máquinas de estado: transiciones permitidas
export const TRANSICIONES_PAGO = {
  PENDIENTE: ['PAGADO', 'VENCIDO', 'ANULADO'],
  VENCIDO: ['PAGADO', 'ANULADO'],
  PAGADO: ['ANULADO'],
  ANULADO: []
}
export const TRANSICIONES_CLASE = {
  PROGRAMADA: ['EN_CURSO', 'CANCELADA'],
  EN_CURSO: ['FINALIZADA'],
  FINALIZADA: [],
  CANCELADA: []
}

const isoDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const MAX_MONTO = 100000

export function validarPago(body = {}) {
  const errors = []
  const docente_id = String(body.docente_id || '')
  if (!isUuid(docente_id)) errors.push('docente_id inválido.')

  const concepto = cleanText(body.concepto, 200)
  if (concepto.length < 3) errors.push('El concepto debe tener al menos 3 caracteres.')

  // Dos modalidades: por horas (el monto se calcula con la tarifa vigente) o monto manual
  const hasHoras = body.horas !== undefined && body.horas !== null && body.horas !== ''
  const horas = hasHoras ? Number(body.horas) : null
  if (hasHoras && (!Number.isFinite(horas) || horas <= 0 || horas > 300 || Math.abs(Math.round(horas * 100) - horas * 100) > 1e-6)) errors.push('Las horas deben estar entre 0.01 y 300 (máximo 2 decimales).')
  const monto = hasHoras ? null : Number(body.monto)
  if (!hasHoras) {
    if (!Number.isFinite(monto) || monto <= 0 || monto > MAX_MONTO) errors.push(`El monto debe ser mayor a 0 y menor o igual a ${MAX_MONTO}.`)
    else if (Math.abs(Math.round(monto * 100) - monto * 100) > 1e-6) errors.push('El monto admite máximo 2 decimales.')
  }

  const moneda = String(body.moneda || 'PEN').toUpperCase()
  if (!MONEDAS.includes(moneda)) errors.push('Moneda no permitida.')

  const metodo_pago = String(body.metodo_pago || '').toUpperCase()
  if (!METODOS_PAGO.includes(metodo_pago)) errors.push('Método de pago no permitido.')

  const pagador_tipo = String(body.pagador_tipo || 'ADMINISTRACION').toUpperCase()
  if (!['ADMINISTRACION', 'EMPRESA'].includes(pagador_tipo)) errors.push('pagador_tipo inválido.')

  const hasEmpresa = body.empresa_id !== undefined && body.empresa_id !== null && body.empresa_id !== ''
  const empresa_id = hasEmpresa ? toPositiveInt(body.empresa_id) : null
  if (hasEmpresa && !empresa_id) errors.push('empresa_id inválido.')

  const periodo_inicio = body.periodo_inicio || null
  const periodo_fin = body.periodo_fin || null
  if (periodo_inicio && !isoDate(periodo_inicio)) errors.push('periodo_inicio debe tener formato AAAA-MM-DD.')
  if (periodo_fin && !isoDate(periodo_fin)) errors.push('periodo_fin debe tener formato AAAA-MM-DD.')
  if (isoDate(periodo_inicio) && isoDate(periodo_fin) && periodo_fin < periodo_inicio) errors.push('periodo_fin no puede ser anterior a periodo_inicio.')

  const estado = String(body.estado || 'PENDIENTE').toUpperCase()
  if (!['PENDIENTE', 'PAGADO'].includes(estado)) errors.push('Un pago nuevo solo puede crearse como PENDIENTE o PAGADO.')

  const fecha_pago = body.fecha_pago || null
  if (fecha_pago && !isoDate(fecha_pago)) errors.push('fecha_pago debe tener formato AAAA-MM-DD.')
  if (estado === 'PAGADO' && !fecha_pago) errors.push('Un pago PAGADO requiere fecha_pago.')

  const referencia_operacion = cleanText(body.referencia_operacion, 60) || null

  if (errors.length) throw badRequest('Datos de pago inválidos.', errors)
  return { docente_id, concepto, horas, monto: hasHoras ? null : Math.round(monto * 100) / 100, moneda, metodo_pago, pagador_tipo, empresa_id, periodo_inicio, periodo_fin, estado, fecha_pago, referencia_operacion }
}

export function validarCambioEstadoPago(body = {}, actual) {
  const estado = String(body.estado || '').toUpperCase()
  if (!ESTADOS_PAGO.includes(estado)) throw badRequest('Estado de pago inválido.')
  if (!TRANSICIONES_PAGO[actual]?.includes(estado)) throw badRequest(`Transición no permitida: ${actual} → ${estado}.`)
  const motivo = cleanText(body.motivo, 300)
  if (estado === 'ANULADO' && motivo.length < 5) throw badRequest('Para anular un pago indica el motivo (mínimo 5 caracteres).')
  const fecha_pago = body.fecha_pago || null
  if (estado === 'PAGADO' && !isoDate(fecha_pago)) throw badRequest('Para marcar como PAGADO indica fecha_pago (AAAA-MM-DD).')
  return { estado, motivo, fecha_pago }
}

export function validarComprobante(body = {}, pagoId) {
  const path = String(body.path || '')
  const re = new RegExp(`^pagos/${Number(pagoId)}/[A-Za-z0-9._-]{1,120}\\.(pdf|jpe?g|png|webp)$`, 'i')
  if (!re.test(path) || path.includes('..')) throw badRequest('Ruta de comprobante inválida.')
  return { path, nombre: cleanText(body.nombre || path.split('/').pop(), 120) }
}

export function validarClaseZoom(body = {}, ahora = new Date()) {
  const errors = []
  const curso_id = toPositiveInt(body.curso_id)
  if (!curso_id) errors.push('curso_id inválido.')

  const titulo = cleanText(body.titulo, 150)
  if (titulo.length < 3) errors.push('El título debe tener al menos 3 caracteres.')
  const descripcion = cleanText(body.descripcion, 500) || null

  const fecha = new Date(body.fecha_inicio)
  if (!body.fecha_inicio || Number.isNaN(fecha.getTime())) errors.push('fecha_inicio inválida.')
  else if (fecha.getTime() <= ahora.getTime()) errors.push('La fecha de inicio debe ser futura.')

  const duracion_minutos = Number(body.duracion_minutos ?? 60)
  if (!Number.isInteger(duracion_minutos) || duracion_minutos < 15 || duracion_minutos > 480) errors.push('La duración debe ser un entero entre 15 y 480 minutos.')

  if (errors.length) throw badRequest('Datos de la clase inválidos.', errors)
  return { curso_id, titulo, descripcion, fecha_inicio: fecha.toISOString(), duracion_minutos }
}

export function validarCambioEstadoClase(body = {}, actual) {
  const estado = String(body.estado || '').toUpperCase()
  if (!ESTADOS_CLASE.includes(estado)) throw badRequest('Estado de clase inválido.')
  if (!TRANSICIONES_CLASE[actual]?.includes(estado)) throw badRequest(`Transición no permitida: ${actual} → ${estado}.`)
  return estado
}

export function parseIdParam(value, name = 'id') {
  const id = toPositiveInt(value)
  if (!id) throw badRequest(`Parámetro ${name} inválido.`)
  return id
}

export function validarTarifa(body = {}) {
  const errors = []
  const docente_id = String(body.docente_id || '')
  if (!isUuid(docente_id)) errors.push('docente_id inválido.')
  const tarifa_hora = Number(body.tarifa_hora)
  if (!Number.isFinite(tarifa_hora) || tarifa_hora <= 0 || tarifa_hora > 5000 || Math.abs(Math.round(tarifa_hora * 100) - tarifa_hora * 100) > 1e-6) errors.push('La tarifa por hora debe estar entre 0.01 y 5000 (máximo 2 decimales).')
  const moneda = String(body.moneda || 'PEN').toUpperCase()
  if (!MONEDAS.includes(moneda)) errors.push('Moneda no permitida.')
  const desde = body.vigente_desde || null
  if (desde && !isoDate(desde)) errors.push('vigente_desde debe tener formato AAAA-MM-DD.')
  if (errors.length) throw badRequest('Datos de tarifa inválidos.', errors)
  return { docente_id, tarifa_hora: Math.round(tarifa_hora * 100) / 100, moneda, vigente_desde: desde }
}
