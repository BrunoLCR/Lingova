import 'dotenv/config'

export function loadEnv(source = process.env) {
  const zoomConfigured = Boolean(source.ZOOM_ACCOUNT_ID && source.ZOOM_CLIENT_ID && source.ZOOM_CLIENT_SECRET)
  const requested = (source.ZOOM_MODE || '').toLowerCase()
  return {
    PORT: Number(source.PORT || 3001),
    NODE_ENV: source.NODE_ENV || 'development',
    SUPABASE_URL: source.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: source.SUPABASE_PUBLISHABLE_KEY,
    ALLOWED_ORIGINS: (source.FRONTEND_URL || 'http://localhost:4200')
      .split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean),
    ZOOM: {
      accountId: source.ZOOM_ACCOUNT_ID,
      clientId: source.ZOOM_CLIENT_ID,
      clientSecret: source.ZOOM_CLIENT_SECRET,
      userId: source.ZOOM_USER_ID || 'me',
      // live solo si hay credenciales completas y no se fuerza mock
      mode: requested !== 'mock' && zoomConfigured ? 'live' : 'mock'
    }
  }
}

export const env = loadEnv()
