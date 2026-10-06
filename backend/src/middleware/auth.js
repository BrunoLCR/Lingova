import { registrarEvento } from '../services/auditService.js'
import { HttpError } from '../utils/httpError.js'

export const ROLES = ['ESTUDIANTE', 'PROFESOR', 'ADMINISTRADOR', 'MARKETING', 'EMPRESA']

/**
 * Autenticación: valida el JWT de Supabase y crea un cliente que actúa "como el usuario"
 * (así PostgreSQL aplica RLS con auth.uid() del token).
 */
export function createAuth({ supabaseFactory }) {
  async function requireAuth(req, _res, next) {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
    if (!token) return next(new HttpError(401, 'Sesión no encontrada.'))

    const supabase = supabaseFactory(token)
    if (!supabase) return next(new HttpError(500, 'Servidor sin conexión configurada a Supabase.'))
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return next(new HttpError(401, 'Sesión inválida o vencida.'))

    req.user = data.user
    req.supabase = supabase
    next()
  }

  async function loadProfile(req, _res, next) {
    const { data, error } = await req.supabase
      .from('profiles')
      .select('id, full_name, email, role, status, phone, empresa_id, created_at')
      .eq('id', req.user.id)
      .single()
    if (error || !data) return next(new HttpError(403, 'Perfil no encontrado para el usuario autenticado.'))
    if (data.status !== 'ACTIVO') return next(new HttpError(403, 'Tu cuenta está inactiva.'))
    // Permisos del rol desde la matriz RBAC en BD (roles_permisos)
    const { data: perms, error: pErr } = await req.supabase.from('roles_permisos').select('permiso').eq('rol', data.role)
    if (pErr) return next(new HttpError(500, 'No se pudieron cargar los permisos del rol.'))
    req.profile = data
    req.permisos = (perms || []).map(x => x.permiso)
    next()
  }

  // RBAC: permite solo los roles indicados; las denegaciones quedan auditadas.
  const requireRoles = (...allowed) => async (req, _res, next) => {
    if (!allowed.includes(req.profile?.role)) {
      await registrarEvento(req.supabase, {
        tipo: 'ACCESO_DENEGADO',
        entidad: 'ruta',
        entidadId: req.originalUrl.split('?')[0].slice(0, 120),
        descripcion: `Rol ${req.profile?.role} intentó acceder a un recurso restringido a ${allowed.join(', ')}`,
        datos: { metodo: req.method }
      })
      return next(new HttpError(403, 'No tienes permisos para este módulo.'))
    }
    next()
  }

  // RBAC dirigido por datos: basta con tener AL MENOS uno de los permisos indicados
  const requirePermiso = (...needed) => async (req, _res, next) => {
    if (!needed.some(p => req.permisos?.includes(p))) {
      await registrarEvento(req.supabase, {
        tipo: 'ACCESO_DENEGADO',
        entidad: 'ruta',
        entidadId: req.originalUrl.split('?')[0].slice(0, 120),
        descripcion: `Rol ${req.profile?.role} sin permiso ${needed.join(' | ')}`,
        datos: { metodo: req.method }
      })
      return next(new HttpError(403, 'No tienes permisos para esta acción.'))
    }
    next()
  }

  const authenticated = [requireAuth, loadProfile]
  const guard = (...roles) => [requireAuth, loadProfile, requireRoles(...roles)]
  const can = (...permisos) => [requireAuth, loadProfile, requirePermiso(...permisos)]
  return { requireAuth, loadProfile, requireRoles, requirePermiso, authenticated, guard, can }
}
