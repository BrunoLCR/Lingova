import { createApp } from '../../src/app.js'
import { loadEnv } from '../../src/config/env.js'

export async function startApp({ factory, zoomClient, envOverrides = {} }) {
  const env = { ...loadEnv({ FRONTEND_URL: 'http://localhost:4200', SUPABASE_URL: 'http://x', SUPABASE_PUBLISHABLE_KEY: 'k' }), ...envOverrides }
  const app = createApp({ env, supabaseFactory: factory, zoomClient })
  const server = await new Promise(r => { const s = app.listen(0, () => r(s)) })
  const base = `http://127.0.0.1:${server.address().port}`
  const call = async (method, path, { token, body, headers } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(headers || {}) },
      body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body))
    })
    return { status: res.status, body: await res.json().catch(() => ({})), headers: res.headers }
  }
  return { call, close: () => new Promise(r => server.close(r)) }
}
