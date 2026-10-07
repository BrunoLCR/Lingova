import { Router } from 'express'
import { createAuth } from '../middleware/auth.js'
import { writeLimiter } from '../middleware/security.js'
import * as dash from '../controllers/dashboardController.js'
import * as pay from '../controllers/paymentController.js'
import * as student from '../controllers/studentController.js'
import * as tar from '../controllers/tarifaController.js'
import * as audit from '../controllers/auditController.js'
import { createZoomController } from '../controllers/zoomController.js'
import { HttpError } from '../utils/httpError.js'

export function createRoutes({ supabaseFactory, zoomConfig, zoomClient }) {
  const router = Router()
  const { authenticated, guard, can } = createAuth({ supabaseFactory })
  const zoom = createZoomController({ zoomConfig, zoomClient })

  router.get('/health', (_req, res) => res.json({ ok: true, service: 'Lingova API', version: '2.0.0' }))
  router.use(writeLimiter)

  // Sesión
  router.get('/me', authenticated, dash.me)

  // Dashboard general: detecta el rol del usuario autenticado y responde con SU dashboard.
  // Nunca devuelve el de otro rol (se decide por req.profile.role, no por parámetros del cliente).
  const dashboardPorRol = {
    ESTUDIANTE: student.studentDashboard,
    PROFESOR: dash.professorDashboard,
    ADMINISTRADOR: dash.adminDashboard,
    MARKETING: dash.marketingDashboard,
    EMPRESA: dash.empresaDashboard
  }
  router.get('/dashboard', authenticated, async (req, res) => {
    const handler = dashboardPorRol[req.profile.role]
    if (!handler) throw new HttpError(403, 'Tu rol no tiene un dashboard asignado.')
    await handler(req, res)
  })

  // Dashboards por rol (RBAC)
  router.get('/student/dashboard', guard('ESTUDIANTE'), student.studentDashboard)
  router.get('/student/catalogo', can('matriculas:autogestionar'), student.catalogo)
  router.post('/student/matricular', can('matriculas:autogestionar'), student.matricular)
  router.get('/student/notas', guard('ESTUDIANTE'), student.notas)
  router.patch('/student/profile', guard('ESTUDIANTE'), dash.updateStudentProfile)
  router.get('/professor/dashboard', guard('PROFESOR'), dash.professorDashboard)
  router.get('/admin/dashboard', guard('ADMINISTRADOR'), dash.adminDashboard)
  router.get('/marketing/dashboard', guard('MARKETING', 'ADMINISTRADOR'), dash.marketingDashboard)
  router.get('/empresa/dashboard', guard('EMPRESA'), dash.empresaDashboard)

  // Pagos a docentes (permisos RBAC)
  router.get('/pagos', can('pagos:listar'), pay.listarPagos)
  router.get('/pagos/docentes', can('pagos:registrar'), pay.listarDocentes)
  router.post('/pagos', can('pagos:registrar'), pay.crearPago)
  router.patch('/pagos/:id/estado', can('pagos:gestionar'), pay.cambiarEstadoPago)
  router.post('/pagos/:id/comprobante', can('pagos:registrar'), pay.adjuntarComprobante)
  router.get('/pagos/:id/comprobante', can('pagos:listar'), pay.obtenerComprobante)

  // Tarifas por hora
  router.get('/tarifas', can('tarifas:ver'), tar.listarTarifas)
  router.post('/tarifas', can('tarifas:gestionar'), tar.establecerTarifa)

  // Clases en vivo (Zoom)
  router.get('/clases-zoom', can('zoom:ver'), zoom.listarClases)
  router.post('/clases-zoom', can('zoom:programar'), zoom.programarClase)
  router.get('/clases-zoom/:id/anfitrion', can('zoom:programar'), zoom.obtenerEnlaceAnfitrion)
  router.patch('/clases-zoom/:id/estado', can('zoom:programar'), zoom.cambiarEstadoClase)

  // Auditoría inmutable
  router.get('/admin/auditoria', can('auditoria:ver'), audit.listarEventos)
  router.get('/admin/auditoria/verificar', can('auditoria:verificar'), audit.verificarCadena)

  return router
}
