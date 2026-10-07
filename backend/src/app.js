import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { env as defaultEnv } from './config/env.js'
import { securityMiddleware, generalLimiter } from './middleware/security.js'
import { createRoutes } from './routes/index.js'
import { HttpError } from './utils/httpError.js'

export function defaultSupabaseFactory(env) {
  return token => {
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null
    return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }
}

export function createApp({ env = defaultEnv, supabaseFactory = defaultSupabaseFactory(env), zoomClient } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // Render / Vercel detrás de proxy
  app.use(securityMiddleware(env))
  app.use(generalLimiter)
  app.use(express.json({ limit: '100kb' }))

  app.use('/api', createRoutes({ supabaseFactory, zoomConfig: env.ZOOM, zoomClient }))

  app.use((req, res) => {
    const ruta = req.originalUrl.split('?')[0].slice(0, 120)
    const pista = ruta.startsWith('/api/api/') ? 'La URL repite /api. Revisa VITE_API_URL: debe ser la base del servidor, sin "/api" al final.' : undefined
    res.status(404).json({ error: 'Ruta no encontrada.', metodo: req.method, ruta, ...(pista ? { pista } : {}) })
  })

  // Manejo centralizado de errores (no filtra detalles internos)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.details ? { detalles: err.details } : {}) })
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' })
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande.' })
    // Errores de PostgREST / RLS
    if (err?.code === '42501' || /row-level security/i.test(err?.message || '')) return res.status(403).json({ error: 'La base de datos rechazó la operación por permisos.' })
    if (err?.code === '23505') return res.status(409).json({ error: 'El registro ya existe.' })
    if (err?.code === '23503') return res.status(409).json({ error: 'Referencia a un registro inexistente.' })
    if (err?.code === '23514') return res.status(400).json({ error: 'Los datos no cumplen las reglas de la base de datos.' })
    console.error('[error]', err)
    res.status(500).json({ error: 'Error interno del servidor.' })
  })

  return app
}
