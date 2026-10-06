import { randomInt } from 'node:crypto'

const OAUTH_URL = 'https://zoom.us/oauth/token'
const API_URL = 'https://api.zoom.us/v2'

let cachedToken = { value: null, expiresAt: 0 }

async function getAccessToken(cfg, fetchImpl) {
  if (cachedToken.value && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')
  const res = await fetchImpl(`${OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(cfg.accountId)}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}` }
  })
  if (!res.ok) throw new Error(`Zoom OAuth falló (${res.status})`)
  const json = await res.json()
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in || 3600) * 1000 }
  return cachedToken.value
}

/**
 * Crea una reunión programada de Zoom.
 * Modo "live": Server-to-Server OAuth contra la API de Zoom.
 * Modo "mock": datos locales marcados como simulados (desarrollo / demo sin credenciales).
 */
export async function crearReunionZoom({ titulo, descripcion, fechaInicioISO, duracionMinutos }, cfg, fetchImpl = fetch) {
  if (cfg.mode !== 'live') {
    const id = String(randomInt(80_000_000_000, 99_999_999_999))
    return {
      simulado: true,
      meetingId: id,
      joinUrl: `https://zoom.us/j/${id}?pwd=SIMULADO`,
      startUrl: `https://zoom.us/s/${id}?zak=SIMULADO`
    }
  }
  const token = await getAccessToken(cfg, fetchImpl)
  const res = await fetchImpl(`${API_URL}/users/${encodeURIComponent(cfg.userId)}/meetings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: titulo,
      agenda: descripcion || undefined,
      type: 2,
      start_time: fechaInicioISO.replace(/\.\d{3}Z$/, 'Z'),
      duration: duracionMinutos,
      timezone: 'America/Lima',
      settings: { join_before_host: false, waiting_room: true, mute_upon_entry: true }
    })
  })
  if (!res.ok) throw new Error(`Zoom no pudo crear la reunión (${res.status})`)
  const json = await res.json()
  return { simulado: false, meetingId: String(json.id), joinUrl: json.join_url, startUrl: json.start_url }
}

export async function cancelarReunionZoom(meetingId, cfg, fetchImpl = fetch) {
  if (cfg.mode !== 'live' || !meetingId) return true
  const token = await getAccessToken(cfg, fetchImpl)
  const res = await fetchImpl(`${API_URL}/meetings/${encodeURIComponent(meetingId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.ok || res.status === 404
}
