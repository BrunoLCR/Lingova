import React, { useState } from 'react'
import { Mail, Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { supabase, supabaseConfigured } from '../lib/supabase.js'
import { apiFetch } from '../lib/api.js'

export default function Login({ go, onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!supabaseConfigured) {
      setError('Falta configurar frontend/.env con los datos de Supabase.')
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const profile = await apiFetch('/api/me')
      onAuthenticated(profile)
    } catch (err) {
      await supabase?.auth.signOut()
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
    <div className="hidden lg:flex lg:w-1/2 bg-blue-700 text-white p-14 flex-col justify-between">
      <div className="bg-white/95 rounded-2xl p-4 self-start"><Logo /></div>
      <div>
        <div className="text-sm font-extrabold tracking-[0.25em] text-blue-200">BIENVENIDO A LINGOVA</div>
        <h1 className="text-5xl font-black mt-5 leading-tight">Aprende, enseña y gestiona desde una sola plataforma.</h1>
        <p className="mt-5 text-blue-100 text-lg max-w-xl">El acceso ahora utiliza autenticación real con Supabase y redirige automáticamente a la vista correspondiente según el rol.</p>
      </div>
      <button onClick={() => go('home')} className="self-start flex items-center gap-2 text-blue-100 font-semibold"><ArrowLeft size={18}/> Volver al inicio</button>
    </div>

    <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-3xl p-9 soft-shadow border border-slate-100">
        <div className="lg:hidden mb-8"><Logo /></div>
        <h2 className="text-3xl font-black">Iniciar sesión</h2>
        <p className="text-slate-500 mt-2">Ingresa con tu cuenta de estudiante, profesor, administrador, marketing o empresa.</p>

        {!supabaseConfigured && <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm flex gap-3"><AlertCircle className="shrink-0" size={19}/><span>La conexión todavía no está configurada. Revisa el README para crear los archivos <b>.env</b>.</span></div>}
        {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Correo electrónico</span>
            <div className="relative mt-2"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input required type="email" autoComplete="username" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@lingova.pe" className="w-full border border-slate-200 rounded-xl py-3 pl-11 pr-4 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200"/></div>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Contraseña</span>
            <div className="relative mt-2"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input required type="password" autoComplete="current-password" maxLength={72} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full border border-slate-200 rounded-xl py-3 pl-11 pr-4 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200"/></div>
          </label>
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2">
            {loading && <Loader2 className="animate-spin" size={18}/>} {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>

        <div className="mt-6 text-xs text-slate-400 text-center">Las cuentas de prueba se encuentran únicamente en el README del proyecto.</div>
      </form>
    </div>
  </div>
}
