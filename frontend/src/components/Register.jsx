import React, { useMemo, useState } from 'react'
import { Loader2, Eye, EyeOff, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { t } from '../lib/i18n.js'
import { LATAM, NA_ES, GLOBAL, VALID_COUNTRIES, countryName, sortedCountries } from '../lib/countries.js'

const inputCls = 'w-full border border-slate-200 rounded-xl py-3 px-4 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Registro internacional: Supabase Auth (signUp) + full_name y country en public.profiles.
// profiles se crea con el trigger handle_new_user() (rol siempre ESTUDIANTE); aquí se refuerza con un update propio.
export default function Register({ lang, onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', country: '' })
  const [show, setShow] = useState(false)
  const [touched, setTouched] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const blur = k => () => setTouched(x => ({ ...x, [k]: true }))

  const errors = useMemo(() => {
    const e = {}
    const name = form.full_name.trim().replace(/\s+/g, ' ')
    if (name.length < 5 || name.split(' ').length < 2) e.full_name = t(lang, 'err.name')
    if (!EMAIL_RE.test(form.email.trim())) e.email = t(lang, 'err.email')
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = t(lang, 'err.password')
    if (form.confirm_password !== form.password || !form.confirm_password) e.confirm_password = t(lang, 'err.mismatch')
    if (!VALID_COUNTRIES.includes(form.country)) e.country = t(lang, 'err.country')
    return e
  }, [form, lang])

  async function submit(ev) {
    ev.preventDefault()
    setTouched({ full_name: true, email: true, password: true, confirm_password: true, country: true }); setError('')
    if (Object.keys(errors).length) return
    if (!supabase) return setError(t(lang, 'err.config'))

    const full_name = form.full_name.trim().replace(/\s+/g, ' ')
    const email = form.email.trim().toLowerCase()
    setBusy(true)
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password: form.password, options: { data: { full_name, country: form.country } } })
      if (err) throw err
      // Con "Confirm email" activo y correo ya existente, Supabase devuelve identities vacías
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) { setError(t(lang, 'err.exists')); return }
      if (!data.session) { setNeedsConfirm(true); return }
      // Refuerzo: asegura full_name y country en public.profiles (el trigger ya lo hace; esto cubre bases sin migrar)
      await supabase.from('profiles').update({ full_name, country: form.country }).eq('id', data.user.id)
      onSuccess?.(data.user)
    } catch (e) {
      setError(/already registered|already exists/i.test(e.message || '') ? t(lang, 'err.exists') : (e.message && /password/i.test(e.message) ? t(lang, 'err.password') : t(lang, 'err.generic')))
    } finally { setBusy(false) }
  }

  if (needsConfirm) return <div className="text-center py-6">
    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 grid place-items-center mx-auto"><MailCheck/></div>
    <p className="mt-4 text-slate-600">{t(lang, 'auth.confirmEmail')}</p>
    <button type="button" onClick={onSwitchToLogin} className="mt-5 font-bold text-blue-700">{t(lang, 'auth.loginLink')}</button>
  </div>

  const fe = k => touched[k] && errors[k]
  const Err = ({ k }) => fe(k) ? <p role="alert" className="text-xs text-red-600 mt-1.5">{errors[k]}</p> : null

  return <form onSubmit={submit} noValidate className="grid gap-4">
    {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

    <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.fullName')}</span>
      <input name="full_name" autoComplete="name" maxLength={100} value={form.full_name} onChange={set('full_name')} onBlur={blur('full_name')} placeholder={t(lang, 'auth.fullNamePh')} aria-invalid={Boolean(fe('full_name'))} className={`${inputCls} mt-1.5`}/><Err k="full_name"/></label>

    <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.email')}</span>
      <input name="email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={set('email')} onBlur={blur('email')} aria-invalid={Boolean(fe('email'))} className={`${inputCls} mt-1.5`}/><Err k="email"/></label>

    <div className="grid sm:grid-cols-2 gap-4">
      <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.password')}</span>
        <div className="relative mt-1.5"><input name="password" type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={form.password} onChange={set('password')} onBlur={blur('password')} aria-invalid={Boolean(fe('password'))} className={`${inputCls} pr-11`}/>
          <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? t(lang, 'auth.hide') : t(lang, 'auth.show')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        {fe('password') ? <Err k="password"/> : <p className="text-xs text-slate-400 mt-1.5">{t(lang, 'auth.passwordHint')}</p>}</label>

      <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.confirm')}</span>
        <input name="confirm_password" type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={72} value={form.confirm_password} onChange={set('confirm_password')} onBlur={blur('confirm_password')} aria-invalid={Boolean(fe('confirm_password'))} className={`${inputCls} mt-1.5`}/>
        <Err k="confirm_password"/>
        {!errors.confirm_password && form.confirm_password && <p className="text-xs text-emerald-600 mt-1.5">{t(lang, 'ok.match')}</p>}</label>
    </div>

    <label className="block"><span className="text-sm font-bold text-slate-700">{t(lang, 'auth.country')}</span>
      <select name="country" autoComplete="country" value={form.country} onChange={set('country')} onBlur={blur('country')} aria-invalid={Boolean(fe('country'))} className={`${inputCls} mt-1.5`}>
        <option value="">{t(lang, 'auth.countryPh')}</option>
        <optgroup label={t(lang, 'auth.group.latam')}>{sortedCountries(LATAM, lang).map(c => <option key={c} value={c}>{countryName(c, lang)}</option>)}</optgroup>
        <optgroup label={t(lang, 'auth.group.na_es')}>{sortedCountries(NA_ES, lang).map(c => <option key={c} value={c}>{countryName(c, lang)}</option>)}</optgroup>
        <optgroup label={t(lang, 'auth.group.global')}><option value={GLOBAL}>{t(lang, 'auth.global')}</option></optgroup>
      </select><Err k="country"/></label>

    <button disabled={busy} className="mt-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold inline-flex items-center justify-center gap-2">
      {busy && <Loader2 className="animate-spin" size={18}/>}{busy ? t(lang, 'auth.creating') : t(lang, 'auth.submitRegister')}</button>
    <p className="text-center text-sm text-slate-500">{t(lang, 'auth.haveAccount')} <button type="button" onClick={onSwitchToLogin} className="font-bold text-blue-700">{t(lang, 'auth.loginLink')}</button></p>
  </form>
}
