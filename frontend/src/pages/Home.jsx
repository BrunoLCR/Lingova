import React from 'react'
import { Search, ArrowRight, PlayCircle, BookOpen, Users, Award } from 'lucide-react'
import Logo from '../components/Logo.jsx'

export default function Home({go}){
  return <div className="min-h-screen bg-slate-50">
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-[1450px] mx-auto px-8 py-4 flex items-center gap-8">
        <Logo />
        <button className="text-slate-700 font-semibold">Cursos</button>
        <div className="mx-auto w-full max-w-xl relative">
          <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none" placeholder="Buscar cursos de inglés..." readOnly />
        </div>
        <button onClick={()=>go('login')} className="text-blue-600 font-bold">Iniciar sesión</button>
        <button onClick={()=>go('login')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200">Comenzar gratis</button>
      </div>
    </header>

    <main>
      <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-orange-100 border-b border-orange-100">
        <div className="max-w-[1450px] mx-auto px-10 py-24 grid lg:grid-cols-2 gap-16 items-center min-h-[650px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-4 py-2 text-sm font-extrabold tracking-widest mb-6"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> PLATAFORMA DE INGLÉS ONLINE</div>
            <h1 className="text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-slate-950">Habla inglés<br/><span className="text-blue-600">con confianza</span></h1>
            <p className="mt-7 text-xl text-slate-500 max-w-2xl leading-relaxed">Cursos diseñados por expertos, seguimiento académico y una experiencia visual moderna para estudiantes y docentes.</p>
            <div className="mt-5 text-slate-500"><span className="line-through">S/239/año</span> &nbsp; <span className="font-bold text-slate-700">Solo <span className="text-orange-500">S/119.50/año</span> — 50% de descuento</span></div>
            <div className="mt-8 flex gap-4">
              <button onClick={()=>go('login')} className="bg-blue-600 text-white px-7 py-4 rounded-xl font-extrabold shadow-lg shadow-blue-200">Comenzar gratis</button>
              <button className="bg-white px-7 py-4 rounded-xl font-bold border border-slate-200 card-shadow">Explorar cursos</button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-slate-500"><div className="flex -space-x-2"><span className="w-9 h-9 rounded-full bg-blue-500 border-2 border-white"></span><span className="w-9 h-9 rounded-full bg-violet-500 border-2 border-white"></span><span className="w-9 h-9 rounded-full bg-pink-500 border-2 border-white"></span><span className="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white"></span><span className="w-9 h-9 rounded-full bg-orange-500 border-2 border-white"></span></div><strong className="text-slate-700">+12,000</strong> estudiantes activos</div>
          </div>

          <div className="relative h-[470px] flex items-center justify-center">
            <div className="absolute w-[360px] h-[360px] rounded-full bg-gradient-to-br from-orange-400 to-orange-500 soft-shadow flex flex-col items-center justify-center text-white">
              <div className="text-6xl font-black">50%</div><div className="text-xl font-semibold">de descuento hoy</div>
            </div>
            <div className="absolute left-4 top-16 bg-white rounded-2xl p-5 w-48 card-shadow"><div className="font-extrabold">Business English Pro</div><div className="text-sm text-slate-500 mt-2">Certificación reconocida</div></div>
            <div className="absolute right-0 bottom-8 bg-white rounded-2xl p-5 w-52 card-shadow"><div className="text-sm text-slate-500">Progreso</div><div className="font-extrabold">TOEFL Ready</div><div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="w-3/4 h-full bg-blue-600"></div></div></div>
          </div>
        </div>
      </section>

      <section className="max-w-[1300px] mx-auto px-8 py-20 grid md:grid-cols-3 gap-6">
        {[['Clases online',PlayCircle],['Seguimiento académico',BookOpen],['Certificados',Award]].map(([t,I])=><div key={t} className="bg-white p-7 rounded-2xl border border-slate-200 card-shadow"><div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><I/></div><h3 className="mt-5 font-extrabold text-xl">{t}</h3><p className="mt-2 text-slate-500">Vista demostrativa del módulo de Lingova para la presentación del proyecto.</p></div>)}
      </section>
    </main>
  </div>
}
