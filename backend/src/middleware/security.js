import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { HttpError } from '../utils/httpError.js'

export function securityMiddleware(env) {
  return [
    helmet(),
    cors({
      origin(origin, cb) {
        // Peticiones sin Origin (curl, health checks) se permiten; navegadores solo orígenes configurados.
        if (!origin || env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
        cb(new HttpError(403, 'Origen no permitido por CORS.'))
      },
      methods: ['GET', 'POST', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  ]
}

const limiterOpts = { standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' } }
export const generalLimiter = rateLimit({ ...limiterOpts, windowMs: 15 * 60 * 1000, limit: 600 })
export const writeLimiter = rateLimit({ ...limiterOpts, windowMs: 15 * 60 * 1000, limit: 120, skip: req => req.method === 'GET' })
