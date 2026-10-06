import React, { useEffect, useRef, useState } from 'react'
import { Search, ChevronDown, Layers, Check } from 'lucide-react'
import { LANGS, t } from '../lib/i18n.js'

function LangMenu({ lang, onLang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const down = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const key = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [])
  const cur = LANGS[lang]
  return <div className="relative" ref={ref}>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={t(lang, 'nav.lang')} onClick={() => setOpen(o => !o)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-sm font-bold">
      <span className="text-base leading-none">{cur.flag}</span>{cur.code}<ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`}/>
    </button>
    {open && <ul role="listbox" className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
      {Object.entries(LANGS).map(([k, v]) => <li key={k} role="option" aria-selected={k === lang}>
        <button type="button" onClick={() => { onLang(k); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50 text-left">
          <span className="text-base">{v.flag}</span><span className="font-semibold flex-1">{v.code} · {v.name}</span>{k === lang && <Check size={14} className="text-blue-600"/>}
        </button></li>)}
    </ul>}
  </div>
}

export default function Navbar({ lang, onLang, query, onQuery, onCourses, onLogin, onRegister, user, onDashboard, onLogout }) {
  return <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-200/70">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-3">
      <a href="/" className="flex items-center gap-3 shrink-0" aria-label="Lingova">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center"><Layers size={20}/></div>
        <div className="leading-tight hidden sm:block"><div className="font-black text-blue-700 tracking-tight">LINGOVA</div><div className="text-[10px] text-slate-500 font-semibold">{t(lang, 'nav.brandSub')}</div></div>
      </a>
      <button type="button" onClick={onCourses} className="text-sm font-bold text-slate-600 hover:text-blue-600 px-2 py-2">{t(lang, 'nav.courses')}</button>

      <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:max-w-md relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
        <input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder={t(lang, 'nav.search')} aria-label={t(lang, 'nav.search')}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white"/>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LangMenu lang={lang} onLang={onLang}/>
        {user ? <>
          <button type="button" onClick={onDashboard} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold">{t(lang, 'nav.dashboard')}</button>
          <button type="button" onClick={onLogout} className="text-sm font-bold text-slate-500 hover:text-slate-800 hidden sm:block">{t(lang, 'nav.logout')}</button>
        </> : <>
          <button type="button" onClick={onLogin} className="text-sm font-bold text-blue-700 hover:text-blue-900 px-2 py-2">{t(lang, 'nav.login')}</button>
          <button type="button" onClick={onRegister} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold whitespace-nowrap">{t(lang, 'nav.start')}</button>
        </>}
      </div>
    </div>
  </header>
}
