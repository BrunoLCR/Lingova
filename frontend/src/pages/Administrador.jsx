import React, { useEffect, useState } from 'react'
import { Home, Users, BookOpen, ClipboardList, BarChart3, Settings, Building2, ShieldCheck, Activity, Loader2, Wallet, Video } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import { apiFetch } from '../lib/api.js'
import ZoomPanel from '../components/ZoomPanel.jsx'
import PagosPanel from '../components/PagosPanel.jsx'
import TarifasPanel from '../components/TarifasPanel.jsx'
import AuditoriaPanel from '../components/AuditoriaPanel.jsx'

const items = [
  { key: 'resumen', label: 'Resumen', icon: Home },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'cursos', label: 'Cursos', icon: BookOpen },
  { key: 'matriculas', label: 'Matrículas', icon: ClipboardList },
  { key: 'pagos', label: 'Pagos', icon: Wallet },
  { key: 'tarifas', label: 'Tarifas', icon: ClipboardList },
  { key: 'clases', label: 'Clases Zoom', icon: Video },
  { key: 'auditoria', label: 'Auditoría', icon: BarChart3 },
  { key: 'configuracion', label: 'Configuración', icon: Settings }
]

export default function Administrador({ profile, onLogout }) {
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/admin/dashboard').then(setData).catch(err => setError(err.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="flex items-center gap-3 text-slate-500 font-semibold"><Loader2 className="animate-spin"/> Cargando panel de administración...</div></div>

  return <DashboardShell title="Panel de administración" subtitle="Vista general de la plataforma Lingova" role="Administrador" name={data?.profile?.full_name || profile?.full_name} items={items} active={section} onSection={setSection} onLogout={onLogout}>
    {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

    {section === 'resumen' && <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          ['Usuarios registrados', data?.counts?.users || 0, Users],
          ['Cursos activos', data?.counts?.courses || 0, BookOpen],
          ['Matrículas activas', data?.counts?.enrollments || 0, Building2],
          ['Eventos de auditoría', data?.counts?.audit || 0, ShieldCheck]
        ].map(([t,v,I]) => <Metric key={t} title={t} value={v} Icon={I}/>)}
      </div>
      <div className="grid xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><h3 className="font-black text-xl">Usuarios recientes</h3><UserTable users={data?.users || []}/></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><Activity/></div><div><h3 className="font-black text-xl">Estado del sistema</h3><p className="text-sm text-slate-500">Servicios principales</p></div></div><div className="mt-6 space-y-4">{[['Frontend React','Operativo'],['API Express','Operativa'],['Supabase Auth','Conectado'],['PostgreSQL','Conectado'],['Auditoría SHA-256','Activa']].map(([a,b]) => <div key={a} className="flex justify-between items-center py-3 border-b border-slate-100"><span className="font-semibold text-slate-700">{a}</span><span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600">{b}</span></div>)}</div></div>
      </div>
    </>}

    {section === 'usuarios' && <Panel title="Usuarios" subtitle="Perfiles registrados en Supabase/PostgreSQL"><UserTable users={data?.users || []}/></Panel>}
    {section === 'cursos' && <Panel title="Cursos" subtitle="Cursos registrados en la plataforma"><SimpleTable headers={['Curso','Nivel','Estado','Profesor']} rows={(data?.courses || []).map(c => [c.name,c.level || '-',c.status,c.teacher || 'Por asignar'])}/></Panel>}
    {section === 'matriculas' && <Panel title="Matrículas" subtitle="Relación entre estudiantes y cursos"><SimpleTable headers={['Estudiante','Curso','Progreso','Estado']} rows={(data?.enrollments || []).map(e => [e.student_name,e.course_name,`${e.progress}%`,e.status])}/></Panel>}
    {section === 'pagos' && <PagosPanel role="ADMINISTRADOR"/>}
    {section === 'tarifas' && <TarifasPanel/>}
    {section === 'clases' && <ZoomPanel courses={(data?.courses || []).filter(c => c.status === 'ACTIVO')}/>}
    {section === 'auditoria' && <AuditoriaPanel/>}
    {section === 'configuracion' && <Panel title="Configuración" subtitle="Información técnica de este avance"><div className="grid md:grid-cols-2 gap-4">{[['Frontend','React + Tailwind CSS'],['Backend','Node.js + Express'],['Base de datos','PostgreSQL alojado en Supabase'],['Autenticación','Supabase Auth'],['API','REST / JSON'],['Seguridad','JWT + RBAC (API) + RLS (BD) + auditoría SHA-256'],['Videoconferencia','Zoom (Server-to-Server OAuth)']].map(([a,b]) => <div key={a} className="bg-slate-50 rounded-xl p-4"><div className="text-xs uppercase tracking-wider font-black text-slate-400">{a}</div><div className="font-bold mt-1">{b}</div></div>)}</div></Panel>}
  </DashboardShell>
}

function Metric({ title, value, Icon }) { return <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><Icon/></div><div className="mt-5 text-3xl font-black">{value}</div><div className="text-slate-500 mt-1">{title}</div></div> }
function Panel({title, subtitle, children}) { return <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow"><h2 className="text-2xl font-black">{title}</h2><p className="text-slate-500 mt-1 mb-6">{subtitle}</p>{children}</div> }
function UserTable({users}) { return <SimpleTable headers={['Usuario','Correo','Rol','Estado']} rows={users.map(u => [u.full_name,u.email,u.role,u.status])}/> }
function SimpleTable({headers, rows}) { return <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-slate-400 border-b uppercase tracking-wider">{headers.map(h => <th key={h} className="py-3 pr-4">{h}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={i} className="border-b border-slate-100">{r.map((cell,j) => <td key={j} className={`py-4 pr-4 ${j===0?'font-bold':''}`}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <div className="text-center text-slate-400 py-8">No hay registros todavía.</div>}</div> }
function formatDate(value) { if (!value) return '-'; return new Intl.DateTimeFormat('es-PE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) }
