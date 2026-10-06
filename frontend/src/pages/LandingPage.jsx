import React, { useMemo, useRef, useState } from 'react'
import { BookOpen, Video, Award, GraduationCap, Briefcase, FileCheck2, Cpu, SearchX } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { t } from '../lib/i18n.js'
import { CURSOS_CATALOGO, CATEGORIAS, filtrarCursos } from '../data/cursosCatalogo.js'

const ICONOS = { general: GraduationCap, business: Briefcase, exams: FileCheck2, tech: Cpu }
const LABELS = {
  es: { general: 'General', business: 'Business', exams: 'Exámenes', tech: 'Tech' },
  en: { general: 'General', business: 'Business', exams: 'Exams', tech: 'Tech' }
}
const money = n => `S/ ${Number(n).toFixed(2)}`

export default function LandingPage({ lang, onLang, user, onRegister, onLogin, onDashboard, onLogout, onEnroll }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const catalogRef = useRef(null)

  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const handleQuery = v => { if (!query && v) scrollToCatalog(); setQuery(v) } // al empezar a escribir, baja al catálogo

  const cursos = useMemo(() => filtrarCursos(CURSOS_CATALOGO, query, cat, LABELS), [query, cat])
  const start = () => (user ? onDashboard() : onRegister())

  return <div className="min-h-screen bg-white text-slate-900">
    <Navbar lang={lang} onLang={onLang} query={query} onQuery={handleQuery} onCourses={scrollToCatalog}
      onLogin={onLogin} onRegister={onRegister} user={user} onDashboard={onDashboard} onLogout={onLogout}/>

    {/* HERO */}
    <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wider uppercase bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"/>{t(lang, 'hero.badge')}</span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mt-6 leading-[1.05]">{t(lang, 'hero.title1')}<br/><span className="text-blue-600">{t(lang, 'hero.title2')}</span></h1>
          <p className="text-slate-500 text-lg mt-6 max-w-lg">{t(lang, 'hero.sub')}</p>
          <p className="mt-5 text-sm"><s className="text-slate-400">{t(lang, 'hero.priceOld')}</s> <span className="font-semibold ml-1">{t(lang, 'hero.only')}</span> <b className="text-orange-500">{t(lang, 'hero.priceNow')}</b> <span className="text-slate-500">— {t(lang, 'hero.priceNote')}</span></p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button type="button" onClick={start} className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-600/20">{t(lang, 'hero.cta')}</button>
            <button type="button" onClick={scrollToCatalog} className="px-7 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 font-extrabold">{t(lang, 'hero.explore')}</button>
          </div>
          <div className="flex items-center gap-3 mt-8 text-sm text-slate-500">
            <div className="flex -space-x-2">{['bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500'].map(c => <span key={c} className={`w-8 h-8 rounded-full border-2 border-white ${c}`}/>)}</div>
            <span><b className="text-slate-800">+12,000</b> {t(lang, 'hero.students')}</span>
          </div>
        </div>
        <div className="relative h-80 md:h-[26rem] hidden sm:block" aria-hidden="true">
          <div className="absolute inset-0 m-auto w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 grid place-items-center text-white text-center shadow-2xl shadow-orange-400/30">
            <div><div className="text-6xl font-black">50%</div><div className="font-semibold mt-1">{t(lang, 'hero.discount')}</div></div></div>
          <div className="absolute left-0 top-6 bg-white rounded-2xl card-shadow px-4 py-3"><div className="font-extrabold text-sm">{t(lang, 'hero.card1Title')}</div><div className="text-xs text-slate-400">{t(lang, 'hero.card1Sub')}</div></div>
          <div className="absolute right-0 bottom-8 bg-white rounded-2xl card-shadow px-4 py-3 w-44"><div className="text-xs text-slate-400">{t(lang, 'hero.card2Label')}</div><div className="font-extrabold text-sm">TOEFL Ready</div><div className="h-1.5 bg-slate-100 rounded-full mt-2"><div className="h-1.5 w-3/4 bg-blue-600 rounded-full"/></div></div>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-5">
        {[[Video, 1], [BookOpen, 2], [Award, 3]].map(([Icon, n]) => <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><Icon size={20}/></div>
          <h3 className="font-extrabold mt-4">{t(lang, `feat.${n}.t`)}</h3><p className="text-sm text-slate-500 mt-1.5">{t(lang, `feat.${n}.d`)}</p></div>)}
      </div>
    </section>

    {/* CATÁLOGO */}
    <section id="catalogo" ref={catalogRef} className="scroll-mt-28 max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{t(lang, 'cat.title')}</h2>
      <p className="text-slate-500 mt-2">{t(lang, 'cat.subtitle')}</p>
      <p className="text-xs font-bold text-blue-700 bg-blue-50 inline-block rounded-full px-3 py-1.5 mt-4">{t(lang, 'cat.legend')}</p>

      <div className="flex flex-wrap items-center gap-2 mt-6" role="tablist">
        {['all', ...CATEGORIAS].map(c => <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
          className={`px-4 py-2 rounded-full text-sm font-bold ${cat === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t(lang, `cat.${c}`)}</button>)}
        {query && <span className="ml-auto text-sm text-slate-500" aria-live="polite">“{query}” · {cursos.length} {t(lang, 'cat.results')}</span>}
      </div>

      {cursos.length === 0 ? <div className="text-center py-16">
        <SearchX className="mx-auto text-slate-300" size={44}/><p className="text-slate-500 mt-3">{t(lang, 'cat.empty')}</p>
        <button type="button" onClick={() => { setQuery(''); setCat('all') }} className="mt-4 font-bold text-blue-700">{t(lang, 'cat.clear')}</button></div>
      : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {cursos.map(c => { const Icon = ICONOS[c.cat]; const x = c[lang]
          return <article key={c.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-blue-300 hover:shadow-lg transition">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center shrink-0"><Icon size={22}/></div>
              <div className="flex-1 min-w-0"><h3 className="font-black text-lg leading-snug">{x.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2"><span className="text-xs font-extrabold bg-blue-600 text-white rounded-full px-2.5 py-1">{t(lang, 'cat.level')} {c.level}</span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{t(lang, `cat.${c.cat}`)}</span></div></div>
            </div>
            <p className="text-sm text-slate-600 mt-4">{x.desc}</p>
            <p className="text-xs text-slate-500 mt-3 bg-slate-50 rounded-xl p-3"><b className="text-slate-700">{c.level}:</b> {x.levelNote}</p>
            <div className="mt-auto pt-5 flex items-center gap-3">
              <div className="flex-1">{c.price ? <span className="font-black text-xl text-blue-700">{money(c.price)}</span> : <span className="text-xs text-slate-400">{t(lang, 'cat.priceAsk')}</span>}</div>
              <button type="button" onClick={() => onEnroll(c.dbName)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold">{t(lang, 'cat.enroll')}</button>
            </div>
          </article> })}
      </div>}
    </section>

    <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">© {new Date().getFullYear()} Lingova. {t(lang, 'footer.rights')}</footer>
  </div>
}
