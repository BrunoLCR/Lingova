import { supabase } from './supabase.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function apiFetch(path, options = {}) {
  if (!supabase) throw new Error('Supabase no está configurado en frontend/.env')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('No existe una sesión activa')

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {})
    }
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    // Sesión vencida o revocada: se cierra para forzar un nuevo login
    if (response.status === 401) await supabase.auth.signOut()
    const detalles = Array.isArray(data.detalles) && data.detalles.length ? ` ${data.detalles.join(' ')}` : ''
    throw new Error(`${data.error || 'No se pudo completar la solicitud'}${detalles}`)
  }
  return data
}

export const apiPost = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPatch = (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
