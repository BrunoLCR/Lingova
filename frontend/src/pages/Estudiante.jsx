import React, { useCallback, useEffect, useState } from 'react'
import { Home, BookOpen, Video, ClipboardList, Award, User, Lock, Plus, GraduationCap, Loader2 } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import ZoomPanel from '../components/ZoomPanel.jsx'
import NotasPanel from '../components/NotasPanel.jsx'
import AgregarCursoModal from '../components/AgregarCursoModal.jsx'
import { apiFetch, apiPatch } from '../lib/api.js'
import { Panel, Metric, Empty, Loading, ErrorBox, OkBox, Field, inputCls, btnPrimary, formatDate } from '../components/ui.jsx'

function BotonAgregar({ onClick }) {
  return <button onClick={onClick} className={btnPrimary}><Plus size={16}/> Agregar curso</button>
}

function Bloqueado({ titulo, onAdd }) {
  return <Panel title={titulo}><div className="text-center py-10">
    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 grid place-items-center mx-auto"><Lock/></div>
    <p className="text-slate-500 mt-4 max-w-md mx-auto">Esta sección se habilita al matricularte en tu primer curso.</p>
    <div className="mt-5"><BotonAgregar onClick={onAdd}/></div></div></Panel>
}

function CursoCard({ c }) {
  return <div className="border border-slate-200 rounded-2xl p-5 bg-white">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center font-black">{c.name.slice(0, 2).toUpperCase()}</div>
      <div className="flex-1 min-w-0"><div className="font-black">{c.name}</div><div className="text-sm text-slate-500">Nivel {c.level} · {c.teacher || 'Docente por asignar'}</div></div>
      <div className="font-black text-blue-700">{Math.round(c.progress)}%</div>
    </div>
    <div className="h-2 bg-slate-100 rounded-full mt-4" role="progressbar" aria-valuenow={Math.round(c.progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-2 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, c.progress)}%` }}/></div>
  </div>
}

export default function Estudiante({ profile, onLogout, abrirAgregar = false, cursoInicial = null }) {
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [showAdd, setShowAdd] = useState(Boolean(abrirAgregar))
  const [cursoPre, setCursoPre] = useState(cursoInicial)

  const load = useCallback(async () => {
    try { setData(await apiFetch('/api/student/dashboard')); setError('') }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  if (loading) return <Loading text="Cargando tu panel..."/>

  const tiene = Boolean(data?.tiene_cursos)
  const courses = data?.courses || []
  const sessions = data?.sessions || []
  const abrir = () => { setAviso(''); setCursoPre(null); setShowAdd(true) }

  async function matriculaLista(r) {
    setShowAdd(false)
    setAviso(`Matrícula activada en ${r.curso}. Ya puedes ver tus Clases, Notas y Certificados.`)
    setLoading(true); await load(); setSection('cursos')
  }

  // Sin matrículas, Clases/Notas/Certificados aparecen con candado
  const items = [
    { key: 'resumen', label: 'Resumen', icon: Home },
    { key: 'cursos', label: 'Mis cursos', icon: BookOpen },
    { key: 'clases', label: 'Clases en vivo', icon: tiene ? Video : Lock },
    { key: 'notas', label: 'Notas', icon: tiene ? ClipboardList : Lock },
    { key: 'certificados', label: 'Certificados', icon: tiene ? Award : Lock },
    { key: 'perfil', label: 'Mi perfil', icon: User }
  ]

  return <DashboardShell title="Panel del estudiante" subtitle={tiene ? 'Tu avance académico' : 'Comienza agregando tu primer curso'} role="Estudiante" name={data?.profile?.full_name || profile?.full_name} items={items} active={section} onSection={setSection} onLogout={onLogout}>
    <ErrorBox text={error}/><OkBox text={aviso}/>

    {section === 'resumen' && (!tiene
      ? <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center card-shadow">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center mx-auto"><GraduationCap size={32}/></div>
          <h2 className="text-2xl font-black mt-5">Aún no tienes cursos</h2>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">Elige un curso y un docente para empezar. Al matricularte se habilitarán tus clases en vivo, notas y certificados.</p>
          <div className="mt-6"><button onClick={abrir} className={`${btnPrimary} text-base px-7 py-3.5`}><Plus size={18}/> Agregar Curso</button></div>
        </div>
      : <>
          <div className="grid sm:grid-cols-3 gap-5">
            <Metric title="Cursos activos" value={courses.length} Icon={BookOpen}/>
            <Metric title="Progreso promedio" value={`${Math.round(courses.reduce((s, c) => s + c.progress, 0) / courses.length)}%`} Icon={Award}/>
            <Metric title="Próximas clases" value={sessions.length} Icon={Video}/>
          </div>
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 card-shadow">
            <div className="flex items-center mb-4"><h2 className="text-xl font-black">Próximas clases</h2><div className="ml-auto"><BotonAgregar onClick={abrir}/></div></div>
            {sessions.length ? sessions.slice(0, 4).map(s => <div key={s.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
              <div className="flex-1"><div className="font-bold">{s.title}</div><div className="text-sm text-slate-500">{s.course_name} · {formatDate(s.starts_at)}</div></div>
              {s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold text-sm">Unirse</a>}</div>) : <Empty text="No hay clases programadas."/>}
          </div>
        </>)}

    {section === 'cursos' && <Panel title="Mis cursos" subtitle="Cursos en los que estás matriculado" action={<BotonAgregar onClick={abrir}/>}>
      {tiene ? <div className="grid md:grid-cols-2 gap-4">{courses.map(c => <CursoCard key={c.id} c={c}/>)}</div> : <Empty text="Todavía no tienes cursos. Presiona “Agregar curso”."/>}
    </Panel>}

    {section === 'clases' && (tiene ? <ZoomPanel courses={courses.map(c => ({ id: c.id, name: c.name }))}/> : <Bloqueado titulo="Clases en vivo" onAdd={abrir}/>)}
    {section === 'notas' && (tiene ? <NotasPanel modo="notas"/> : <Bloqueado titulo="Notas" onAdd={abrir}/>)}
    {section === 'certificados' && (tiene ? <NotasPanel modo="certificados"/> : <Bloqueado titulo="Certificados" onAdd={abrir}/>)}
    {section === 'perfil' && <PerfilForm profile={data?.profile || profile} onSaved={load}/>}

    {showAdd && <AgregarCursoModal cursoInicial={cursoPre} onClose={() => setShowAdd(false)} onDone={matriculaLista}/>}
  </DashboardShell>
}

function PerfilForm({ profile, onSaved }) {
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(''); setOk('')
    try { await apiPatch('/api/student/profile', form); setOk('Perfil actualizado.'); onSaved() } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <Panel title="Mi perfil" subtitle={profile?.email}>
    <ErrorBox text={error}/><OkBox text={ok}/>
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 max-w-2xl">
      <Field label="Nombre completo"><input required minLength={3} maxLength={100} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls}/></Field>
      <Field label="Teléfono"><input maxLength={20} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls}/></Field>
      <div className="md:col-span-2"><button disabled={saving} className={btnPrimary}>{saving && <Loader2 className="animate-spin" size={16}/>} Guardar cambios</button></div>
    </form>
  </Panel>
}
