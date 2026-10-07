import { supabase } from './supabase.js'

// Base del servidor SIN el prefijo /api (los paths ya lo incluyen: '/api/me', '/api/student/dashboard', ...).
// Se normaliza para tolerar VITE_API_URL con barra final o con "/api" al final (causaba /api/api/... → 404).
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim().replace(/\/+$/, '').replace(/\/api$/i, '')

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

// Dashboard según el rol del usuario autenticado.
export const DASHBOARD_PATH = {
  ESTUDIANTE: '/api/student/dashboard',
  PROFESOR: '/api/professor/dashboard',
  ADMINISTRADOR: '/api/admin/dashboard',
  MARKETING: '/api/marketing/dashboard',
  EMPRESA: '/api/empresa/dashboard'
}
export const rutaDashboard = role => DASHBOARD_PATH[role] || '/api/me'

// Opción A: el backend detecta el rol y devuelve el dashboard correcto.
export const apiDashboard = () => apiFetch('/api/dashboard')
// Opción B: el frontend ya conoce el rol (por /api/me o profiles) y llama a su ruta.
export const apiDashboardPorRol = role => apiFetch(rutaDashboard(role))
