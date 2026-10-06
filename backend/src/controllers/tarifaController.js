import { badRequest } from '../utils/httpError.js'
import { validarTarifa } from '../utils/validators.js'

const COLS = 'id, docente_id, tarifa_hora, moneda, vigente_desde, vigente_hasta, created_at, docente:profiles!tarifas_docentes_docente_id_fkey(full_name)'

export async function listarTarifas(req, res) {
  let q = req.supabase.from('tarifas_docentes').select(COLS).order('vigente_desde', { ascending: false }).limit(200)
  if (req.query.vigentes === 'true') q = q.is('vigente_hasta', null)
  const { data, error } = await q
  if (error) throw error
  res.json((data || []).map(({ docente, ...t }) => ({ ...t, docente_nombre: docente?.full_name || null, vigente: t.vigente_hasta === null })))
}

// Cierra la tarifa vigente y abre una nueva (función SQL atómica y auditada)
export async function establecerTarifa(req, res) {
  const t = validarTarifa(req.body)
  const args = { p_docente: t.docente_id, p_tarifa: t.tarifa_hora, p_moneda: t.moneda }
  if (t.vigente_desde) args.p_desde = t.vigente_desde
  const { data, error } = await req.supabase.rpc('establecer_tarifa', args)
  if (error) {
    if (error.code === '22023') throw badRequest(error.message)
    throw error
  }
  res.status(201).json({ id: data, ...t })
}
