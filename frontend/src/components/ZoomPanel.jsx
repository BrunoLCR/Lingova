import React, { useCallback, useEffect, useState } from 'react'
import { Video, Loader2, ExternalLink, CalendarPlus } from 'lucide-react'
import { apiFetch, apiPost, apiPatch } from '../lib/api.js'
import { Panel, Badge, Empty, ErrorBox, OkBox, Field, inputCls, btnPrimary, btnGhost, formatDate } from './ui.jsx'

// Panel de clases en vivo (Zoom). Los docentes/administradores programan; los estudiantes solo ven y se unen.
export default function ZoomPanel({ courses = [] }) {
  const [state, setState] = useState({ loading: true, clases: [], puede: false })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ curso_id: '', titulo: '', fecha_local: '', duracion_minutos: 60, descripcion: '' })

  const load = useCallback(async () => {
    try {
      const r = await apiFetch('/api/clases-zoom')
      setState({ loading: false, clases: r.clases, puede: r.puede_programar })
    } catch (e) { setError(e.message); setState(s => ({ ...s, loading: false })) }
  }, [])
  useEffect(() => { load() }, [load])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault(); setError(''); setOk(''); setSaving(true)
    try {
      const res = await apiPost('/api/clases-zoom', {
        curso_id: Number(form.curso_id), titulo: form.titulo, descripcion: form.descripcion,
        fecha_inicio: form.fecha_local ? new Date(form.fecha_local).toISOString() : '', duracion_minutos: Number(form.duracion_minutos)
      })
      setOk(`Clase programada${res.simulado ? ' (modo simulado: sin credenciales de Zoom)' : ''}.`)
      setForm({ curso_id: '', titulo: '', fecha_local: '', duracion_minutos: 60, descripcion: '' })
      load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function iniciar(id) {
    setError('')
    try { const r = await apiFetch(`/api/clases-zoom/${id}/anfitrion`); window.open(r.zoom_start_url, '_blank', 'noopener,noreferrer') }
    catch (err) { setError(err.message) }
  }
  async function cambiar(id, estado) {
    setError(''); setOk('')
    try { await apiPatch(`/api/clases-zoom/${id}/estado`, { estado }); setOk(`Clase actualizada a ${estado}.`); load() }
    catch (err) { setError(err.message) }
  }

  const minLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 3600e3).toISOString().slice(0, 16)

  return <Panel title="Clases en vivo" subtitle={state.puede ? 'Programa sesiones de Zoom para tus cursos' : 'Sesiones de Zoom de tus cursos'}>
    <ErrorBox text={error}/><OkBox text={ok}/>
    {state.puede && <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-5 mb-8">
      <Field label="Curso"><select required value={form.curso_id} onChange={set('curso_id')} className={inputCls}><option value="">Selecciona un curso</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Título"><input required minLength={3} maxLength={150} value={form.titulo} onChange={set('titulo')} placeholder="Speaking practice" className={inputCls}/></Field>
      <Field label="Fecha y hora de inicio"><input required type="datetime-local" min={minLocal} value={form.fecha_local} onChange={set('fecha_local')} className={inputCls}/></Field>
      <Field label="Duración (minutos)"><input required type="number" min={15} max={480} step={5} value={form.duracion_minutos} onChange={set('duracion_minutos')} className={inputCls}/></Field>
      <div className="md:col-span-2"><Field label="Descripción (opcional)"><input maxLength={500} value={form.descripcion} onChange={set('descripcion')} className={inputCls}/></Field></div>
      <div className="md:col-span-2"><button disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="animate-spin" size={16}/> : <CalendarPlus size={16}/>} Programar clase</button></div>
    </form>}

    {state.loading ? <Empty text="Cargando clases..."/> : <div className="space-y-4">
      {state.clases.map(c => <div key={c.id} className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 grid place-items-center shrink-0"><Video/></div>
        <div className="flex-1 min-w-0">
          <div className="font-black">{c.titulo}</div>
          <div className="text-sm text-slate-500">{c.curso_nombre || `Curso #${c.curso_id}`} · {formatDate(c.fecha_inicio)} · {c.duracion_minutos} min{c.simulado ? ' · simulada' : ''}</div>
        </div>
        <Badge value={c.estado}/>
        <div className="flex gap-2 flex-wrap">
          {c.estado === 'PROGRAMADA' && c.zoom_join_url && <a href={c.zoom_join_url} target="_blank" rel="noopener noreferrer" className={`${btnGhost} inline-flex items-center gap-1.5`}><ExternalLink size={14}/> Unirse</a>}
          {state.puede && c.estado === 'PROGRAMADA' && <>
            <button onClick={() => iniciar(c.id)} className={btnGhost}>Iniciar como anfitrión</button>
            <button onClick={() => cambiar(c.id, 'EN_CURSO')} className={btnGhost}>Marcar en curso</button>
            <button onClick={() => { if (window.confirm('¿Cancelar esta clase?')) cambiar(c.id, 'CANCELADA') }} className={`${btnGhost} text-red-600`}>Cancelar</button>
          </>}
          {state.puede && c.estado === 'EN_CURSO' && <button onClick={() => cambiar(c.id, 'FINALIZADA')} className={btnGhost}>Finalizar</button>}
        </div>
      </div>)}
      {!state.clases.length && <Empty text="No hay clases programadas."/>}
    </div>}
  </Panel>
}
