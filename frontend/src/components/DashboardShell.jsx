import React from 'react'
import { Home, BookOpen, Users, ClipboardList, BarChart3, Settings, LogOut, Bell, Search } from 'lucide-react'
import Logo from './Logo.jsx'

export default function DashboardShell({title, subtitle, role, children, go, admin=false}){
  const items = admin ? [['Resumen',Home],['Usuarios',Users],['Cursos',BookOpen],['Matrículas',ClipboardList],['Auditoría',BarChart3],['Configuración',Settings]] : [['Resumen',Home],['Mis cursos',BookOpen],['Estudiantes',Users],['Evaluaciones',ClipboardList],['Progreso',BarChart3],['Configuración',Settings]]
  return <div className="min-h-screen bg-slate-50 flex">
    <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:block">
      <Logo />
      <div className="mt-8 text-xs font-extrabold tracking-widest text-slate-400">MENÚ PRINCIPAL</div>
      <nav className="mt-3 space-y-1">{items.map(([label,I],idx)=><div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${idx===0?'bg-blue-50 text-blue-700':'text-slate-500'}`}><I size={19}/>{label}</div>)}</nav>
      <div className="absolute bottom-6"><button onClick={()=>go('home')} className="flex items-center gap-2 text-slate-500 font-semibold"><LogOut size={18}/> Salir</button></div>
    </aside>
    <div className="flex-1">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center gap-4">
        <div><div className="font-extrabold text-xl">{title}</div><div className="text-sm text-slate-500">{subtitle}</div></div>
        <div className="ml-auto relative hidden md:block"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input readOnly placeholder="Buscar..." className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4"/></div>
        <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center"><Bell size={18}/></div>
        <div className="text-right"><div className="font-bold text-sm">{role}</div><div className="text-xs text-slate-400">Lingova</div></div>
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">L</div>
      </header>
      <main className="p-8">{children}</main>
    </div>
  </div>
}
