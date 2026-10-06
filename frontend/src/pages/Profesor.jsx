import React, { useEffect, useMemo, useState } from 'react'
import { Home, BookOpen, Users, ClipboardList, BarChart3, Loader2, Clock, TrendingUp, Video, Wallet } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import { apiFetch } from '../lib/api.js'
import ZoomPanel from '../components/ZoomPanel.jsx'
import PagosPanel from '../components/PagosPanel.jsx'

const items = [
  { key: 'resumen', label: 'Resumen', icon: Home },
  { key: 'cursos', label: 'Mis cursos', icon: BookOpen },
  { key: 'estudiantes', label: 'Estudiantes', icon: Users },
  { key: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardList },
  { key: 'progreso', label: 'Progreso', icon: BarChart3 },
  { key: 'clases', label: 'Clases en vivo', icon: Video },
  { key: 'pagos', label: 'Mis pagos', icon: Wallet }
]

export default function Profesor({ profile, onLogout }) {
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/professor/dashboard').then(setData).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  const studentsCount = useMemo(() => new Set((data?.students || []).map(x => x.student_id)).size, [data])

  if (loading) return <Loading text="Cargando panel del profesor..."/>

  return <DashboardShell title="Panel del profesor" subtitle="Gestión académica de tus cursos" role="Profesor" name={data?.profile?.full_name || profile?.full_name} items={items} active={section} onSection={setSection} onLogout={onLogout}>
    {error && <ErrorBox text={error}/>} 
    {section === 'resumen' && <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          ['Cursos asignados', data?.courses?.length || 0, BookOpen],
          ['Estudiantes activos', studentsCount, Users],
          ['Próximas clases', data?.sessions?.length || 0, Clock],
          ['Promedio de avance', `${Math.round(data?.average_progress || 0)}%`, TrendingUp]
        ].map(([t,v,I]) => <Metric key={t} title={t} value={v} Icon={I}/>)}
      </div>
      <div className="grid xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><h3 className="font-black text-xl">Mis cursos</h3><div className="mt-5 space-y-4">{data?.courses?.map(course => <div key={course.id} className="p-4 rounded-xl bg-slate-50 flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl grid place-items-center text-blue-700 font-black">EN</div><div className="flex-1"><div className="font-extrabold">{course.name}</div><div className="text-sm text-slate-500">Nivel {course.level || '-'}</div></div><div className="font-bold text-sm text-slate-500">{course.student_count || 0} estudiantes</div></div>)}{!data?.courses?.length && <Empty text="No tienes cursos asignados."/>}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><h3 className="font-black text-xl">Próximas sesiones</h3><div className="mt-5 space-y-4">{data?.sessions?.slice(0,5).map(s => <div key={s.id}><div className="font-bold text-sm">{s.title}</div><div className="text-xs text-slate-500 mt-1">{s.course_name} · {formatDate(s.starts_at)}</div></div>)}{!data?.sessions?.length && <Empty text="Sin sesiones próximas."/>}</div></div>
      </div>
    </>}
    {section === 'cursos' && <Panel title="Mis cursos" subtitle="Cursos asignados desde la base de datos"><div className="grid md:grid-cols-2 gap-5">{data?.courses?.map(course => <div key={course.id} className="border border-slate-200 rounded-2xl p-5"><div className="text-blue-600 text-xs font-black tracking-widest">NIVEL {course.level || '-'}</div><h3 className="text-xl font-black mt-2">{course.name}</h3><p className="text-sm text-slate-500 mt-2">{course.description || 'Sin descripción.'}</p><div className="mt-4 font-bold text-sm">{course.student_count || 0} estudiantes matriculados</div></div>)}</div></Panel>}
    {section === 'estudiantes' && <Panel title="Estudiantes" subtitle="Alumnos matriculados en tus cursos"><Table headers={['Estudiante','Curso','Progreso']} rows={(data?.students || []).map(x => [x.student_name, x.course_name, `${x.progress}%`])}/></Panel>}
    {section === 'evaluaciones' && <Panel title="Evaluaciones" subtitle="Evaluaciones creadas para tus cursos"><Table headers={['Evaluación','Curso','Fecha límite']} rows={(data?.assessments || []).map(x => [x.title, x.course_name, formatDate(x.due_at)])}/></Panel>}
    {section === 'progreso' && <Panel title="Progreso académico" subtitle="Promedio registrado por estudiante"><div className="space-y-4">{(data?.students || []).map((x,i) => <div key={`${x.student_id}-${x.course_id}-${i}`}><div className="flex justify-between text-sm mb-2"><span className="font-bold">{x.student_name} · {x.course_name}</span><span>{x.progress}%</span></div><div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{width:`${Math.min(100, Number(x.progress||0))}%`}}/></div></div>)}</div></Panel>}
    {section === 'clases' && <ZoomPanel courses={data?.courses || []}/>}
    {section === 'pagos' && <PagosPanel role="PROFESOR"/>}
  </DashboardShell>
}

function Metric({ title, value, Icon }) { return <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><Icon/></div><div className="mt-5 text-3xl font-black">{value}</div><div className="text-slate-500 mt-1">{title}</div></div> }
function Panel({ title, subtitle, children }) { return <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><h2 className="text-2xl font-black">{title}</h2><p className="text-slate-500 mt-1 mb-6">{subtitle}</p>{children}</div> }
function Table({ headers, rows }) { return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b text-xs uppercase tracking-wider text-slate-400">{headers.map(h => <th key={h} className="py-3 pr-4">{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={i} className="border-b border-slate-100">{row.map((cell,j) => <td key={j} className={`py-4 pr-4 ${j===0?'font-bold':''}`}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <Empty text="No hay información registrada."/>}</div> }
function Empty({ text }) { return <div className="text-slate-400 py-7 text-center">{text}</div> }
function Loading({ text }) { return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="flex items-center gap-3 text-slate-500 font-semibold"><Loader2 className="animate-spin"/> {text}</div></div> }
function ErrorBox({ text }) { return <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{text}</div> }
function formatDate(value) { if (!value) return 'Pendiente'; return new Intl.DateTimeFormat('es-PE', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)) }
