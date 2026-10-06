import React, { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { t } from '../lib/i18n.js'
import Register from './Register.jsx'

const inputCls = 'w-full border border-slate-200 rounded-xl py-3 px-4 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white'

function LoginForm({ lang, onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault(); setError('')
    if (!supabase) return setError(t(lang, 'err.config'))
    setBusy(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    setBusy(false)
    if (err) return setError(/invalid/i.test(err.message) ? t(lang, 'err.invalid') : t(lang, 'err.generic'))
    onSuccess?.(data.user)
  }

  return <form onSubmit={submit} className="grid gap-4">
    {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
    <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.email')}</span>
      <input type="email" required autoComplete="username" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className={`${inputCls} mt-1.5`}/></label>
    <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.password')}</span>
      <input type="password" required autoComplete="current-password" maxLength={72} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} mt-1.5`}/></label>
    <button disabled={busy} className="py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold inline-flex items-center justify-center gap-2">
      {busy && <Loader2 className="animate-spin" size={18}/>}{busy ? t(lang, 'auth.signingIn') : t(lang, 'auth.submitLogin')}</button>
    <p className="text-center text-sm text-slate-500">{t(lang, 'auth.noAccount')} <button type="button" onClick={onSwitchToRegister} className="font-bold text-blue-700">{t(lang, 'auth.registerLink')}</button></p>
  </form>
}

// mode inicial: 'register' (botones "Comenzar gratis" / "Matricularme") o 'login'
export default function AuthModal({ lang, mode: initialMode = 'register', pendingCurso, onClose, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode)
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return <div className="fixed inset-0 z-50 bg-slate-900/50 grid place-items-center p-4 overflow-y-auto" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-label={t(lang, mode === 'register' ? 'auth.registerTitle' : 'auth.loginTitle')} className="bg-white rounded-3xl w-full max-w-lg p-7 sm:p-8 card-shadow relative my-6">
      <button type="button" onClick={onClose} aria-label={t(lang, 'auth.close')} className="absolute right-4 top-4 p-2 rounded-lg hover:bg-slate-100"><X size={20}/></button>
      <h2 className="text-2xl font-black pr-8">{t(lang, mode === 'register' ? 'auth.registerTitle' : 'auth.loginTitle')}</h2>
      <p className="text-slate-500 mt-1 mb-6">{t(lang, mode === 'register' ? 'auth.registerSub' : 'auth.loginSub')}</p>
      {pendingCurso && <div className="mb-5 bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-xl p-3">{t(lang, 'auth.pending')} <b>{pendingCurso}</b>.</div>}
      {mode === 'register'
        ? <Register lang={lang} onSuccess={onAuthenticated} onSwitchToLogin={() => setMode('login')}/>
        : <LoginForm lang={lang} onSuccess={onAuthenticated} onSwitchToRegister={() => setMode('register')}/>}
    </div>
  </div>
}
