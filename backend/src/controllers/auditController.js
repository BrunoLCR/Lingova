import { badRequest } from '../utils/httpError.js'
import { registrarEvento } from '../services/auditService.js'
import { cleanText } from '../utils/sanitize.js'

const COLS = 'id, tipo_evento, entidad, entidad_id, usuario_id, rol_usuario, descripcion, hash_anterior, hash_integridad, created_at'

export async function listarEventos(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
  let q = req.supabase.from('eventos_auditoria').select(COLS).order('id', { ascending: false }).limit(limit)
  if (req.query.tipo) {
    const tipo = cleanText(req.query.tipo, 60)
    if (!/^[A-Z0-9_]+$/.test(tipo)) throw badRequest('Filtro de tipo inválido.')
    q = q.eq('tipo_evento', tipo)
  }
  const { data, error } = await q
  if (error) throw error
  res.json(data || [])
}

export async function verificarCadena(req, res) {
  const { data, error } = await req.supabase.rpc('verificar_cadena_auditoria')
  if (error) throw error
  const alterados = data || []
  const { count } = await req.supabase.from('eventos_auditoria').select('id', { count: 'exact', head: true })
  await registrarEvento(req.supabase, {
    tipo: 'VERIFICACION_AUDITORIA',
    entidad: 'eventos_auditoria',
    descripcion: alterados.length ? `Se detectaron ${alterados.length} eventos alterados` : 'Cadena íntegra',
    datos: { eventos_verificados: count ?? null, alterados: alterados.length }
  })
  res.json({ integra: alterados.length === 0, eventos_verificados: count ?? null, alterados, algoritmo: 'SHA-256', verificado_en: new Date().toISOString() })
}
