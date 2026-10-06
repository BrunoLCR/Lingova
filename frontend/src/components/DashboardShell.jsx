import React from 'react'
import { Bell, Search, LogOut } from 'lucide-react'
import Logo from './Logo.jsx'

export default function DashboardShell({ title, subtitle, role, name, children, items = [], active, onSection, onLogout }) {
  const initial = (name || role || 'L').trim().charAt(0).toUpperCase()

  return <div className="min-h-screen bg-slate-50 flex">
    <aside className="w-72 bg-white border-r border-slate-200 p-6 hidden lg:flex lg:flex-col">
      <Logo />
      <div className="mt-8 text-xs font-extrabold tracking-widest text-slate-400">MENÚ PRINCIPAL</div>
      <nav className="mt-3 space-y-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSection?.(key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-left transition ${active === key ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Icon size={19}/>{label}
          </button>
        ))}
      </nav>
      <button onClick={onLogout} className="mt-auto flex items-center gap-2 text-slate-500 hover:text-red-600 font-semibold px-4 py-3">
        <LogOut size={18}/> Cerrar sesión
      </button>
    </aside>

    <div className="flex-1 min-w-0">
      <header className="min-h-20 bg-white border-b border-slate-200 px-5 md:px-8 py-4 flex items-center gap-4">
        <div>
          <div className="font-extrabold text-xl">{title}</div>
          <div className="text-sm text-slate-500">{subtitle}</div>
        </div>
        <div className="ml-auto relative hidden md:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input readOnly placeholder="Buscar..." className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4"/>
        </div>
        <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center"><Bell size={18}/></div>
        <div className="text-right hidden sm:block">
          <div className="font-bold text-sm">{name || role}</div>
          <div className="text-xs text-slate-400">{role}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">{initial}</div>
      </header>

      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 overflow-x-auto flex gap-2">
        {items.map(({ key, label }) => (
          <button key={key} onClick={() => onSection?.(key)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold ${active === key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
        ))}
      </div>

      <main className="p-5 md:p-8">{children}</main>
    </div>
  </div>
}
