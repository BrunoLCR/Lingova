import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase.js'
import { loadLang, saveLang, t } from './lib/i18n.js'
import LandingPage from './pages/LandingPage.jsx'
import AuthModal from './components/AuthModal.jsx'
import Estudiante from './pages/Estudiante.jsx'
import Profesor from './pages/Profesor.jsx'
import Administrador from './pages/Administrador.jsx'
import Marketing from './pages/Marketing.jsx'
import Empresa from './pages/Empresa.jsx'
import { Loading } from './components/ui.jsx'

const VISTAS = { ESTUDIANTE: Estudiante, PROFESOR: Profesor, ADMINISTRADOR: Administrador, MARKETING: Marketing, EMPRESA: Empresa }

export default function App() {
  const [lang, setLangState] = useState(loadLang)
  const [path, setPath] = useState(window.location.pathname)
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [profile, setProfile] = useState(null)
  const [auth, setAuth] = useState(null)            // { mode, pendingCurso }
  const [intent, setIntent] = useState(null)        // { curso } → abre AgregarCursoModal en el dashboard
  const [notice, setNotice] = useState('')

  const setLang = l => { setLangState(l); saveLang(l) }
  const navigate = useCallback((to, replace = false) => {
    if (window.location.pathname !== to) window.history[replace ? 'replaceState' : 'pushState']({}, '', to)
    setPath(to); window.scrollTo(0, 0)
  }, [])

  useEffect(() => { const f = () => setPath(window.location.pathname); window.addEventListener('popstate', f); return () => window.removeEventListener('popstate', f) }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  // Sesión de Supabase
  useEffect(() => {
    if (!supabase) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Perfil (rol) del usuario autenticado
  const uid = session?.user?.id
  useEffect(() => {
    if (!uid) { setProfile(null); return }
    let cancel = false
    supabase.from('profiles').select('id, full_name, email, role, status, phone, country, empresa_id').eq('id', uid).single().then(({ data, error }) => {
      if (cancel) return
      if (error || !data || data.status !== 'ACTIVO') { setNotice(t(lang, 'err.inactive')); supabase.auth.signOut(); return }
      setProfile(data)
    })
    return () => { cancel = true }
  }, [uid]) // eslint-disable-line react-hooks/exhaustive-deps

  async function logout() { await supabase?.auth.signOut(); setProfile(null); setIntent(null); navigate('/') }

  // Registro / login exitoso → dashboard (con matrícula pendiente si venía de "Matricularme")
  function onAuthenticated() {
    if (auth?.pendingCurso) setIntent({ curso: auth.pendingCurso })
    setAuth(null); navigate('/dashboard')
  }

  // "Matricularme": sin sesión → modal de registro; con sesión → dashboard con AgregarCursoModal
  function onEnroll(curso) {
    if (!session) return setAuth({ mode: 'register', pendingCurso: curso })
    setIntent({ curso }); navigate('/dashboard')
  }

  // Limpia la intención una vez que el dashboard ya la consumió
  useEffect(() => { if (intent && path === '/dashboard' && profile) { const id = setTimeout(() => setIntent(null), 0); return () => clearTimeout(id) } }, [intent, path, profile])

  // /dashboard exige sesión
  useEffect(() => { if (path === '/dashboard' && session === null) { navigate('/', true); setAuth({ mode: 'login' }) } }, [path, session, navigate])

  if (session === undefined) return <Loading text="..."/>

  if (path === '/dashboard' && session) {
    if (!profile) return <Loading text="..."/>
    const Vista = VISTAS[profile.role]
    if (!Vista) return <Loading text="..."/>
    const extra = profile.role === 'ESTUDIANTE' ? { abrirAgregar: Boolean(intent), cursoInicial: intent?.curso || null } : {}
    return <Vista profile={profile} onLogout={logout} {...extra}/>
  }

  return <>
    {notice && <div role="alert" className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm shadow">{notice} <button className="ml-2 font-bold" onClick={() => setNotice('')}>×</button></div>}
    <LandingPage lang={lang} onLang={setLang} user={profile}
      onRegister={() => setAuth({ mode: 'register' })} onLogin={() => setAuth({ mode: 'login' })}
      onDashboard={() => navigate('/dashboard')} onLogout={logout} onEnroll={onEnroll}/>
    {auth && <AuthModal lang={lang} mode={auth.mode} pendingCurso={auth.pendingCurso} onClose={() => setAuth(null)} onAuthenticated={onAuthenticated}/>}
  </>
}
