import React from 'react'
import { Users, BookOpen, CheckCircle2, Clock, MoreHorizontal, TrendingUp } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'

export default function Profesor({go}){
  return <DashboardShell title="Panel del profesor" subtitle="Resumen académico de tus cursos" role="Profesor" go={go}>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[['Cursos asignados','4',BookOpen],['Estudiantes activos','68',Users],['Evaluaciones pendientes','12',Clock],['Promedio de avance','82%',TrendingUp]].map(([t,v,I])=><div key={t} className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow"><div className="flex justify-between"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><I/></div><MoreHorizontal className="text-slate-300"/></div><div className="mt-5 text-3xl font-black">{v}</div><div className="text-slate-500 mt-1">{t}</div></div>)}
    </div>
    <div className="grid xl:grid-cols-3 gap-6 mt-6">
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 card-shadow">
        <div className="flex justify-between items-center"><div><h3 className="font-black text-xl">Mis cursos</h3><p className="text-slate-500 text-sm mt-1">Cursos asignados actualmente</p></div><span className="text-blue-600 font-bold text-sm">Ver todos</span></div>
        <div className="mt-6 space-y-4">
          {[['Business English B1','24 estudiantes','76%'],['English A2 - General','18 estudiantes','88%'],['TOEFL Preparation','16 estudiantes','64%']].map((x)=><div key={x[0]} className="p-4 rounded-xl bg-slate-50 flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-black">EN</div><div className="flex-1"><div className="font-extrabold">{x[0]}</div><div className="text-sm text-slate-500">{x[1]}</div></div><div className="text-right"><div className="font-black">{x[2]}</div><div className="text-xs text-slate-400">avance</div></div></div>)}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><h3 className="font-black text-xl">Actividad reciente</h3><div className="mt-6 space-y-5">{['Evaluación registrada en Business English B1','Nuevo estudiante matriculado','Contenido actualizado en TOEFL Preparation','Progreso semanal revisado'].map(t=><div key={t} className="flex gap-3"><CheckCircle2 className="text-emerald-500 shrink-0" size={20}/><div><div className="font-semibold text-sm">{t}</div><div className="text-xs text-slate-400 mt-1">Vista demostrativa</div></div></div>)}</div></div>
    </div>
  </DashboardShell>
}
