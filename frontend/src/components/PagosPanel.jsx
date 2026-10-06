import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Paperclip, Eye, CheckCircle2, Ban } from 'lucide-react'
import { apiFetch, apiPost, apiPatch } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { Panel, Badge, Empty, ErrorBox, OkBox, Field, inputCls, btnPrimary, btnGhost, formatMoney, formatDay } from './ui.jsx'

const METODOS = ['TRANSFERENCIA', 'DEPOSITO', 'YAPE', 'PLIN', 'EFECTIVO', 'TARJETA']
const MAX_BYTES = 5 * 1024 * 1024
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const EMPTY = { docente_id: '', concepto: '', modalidad: 'MONTO', horas: '', monto: '', moneda: 'PEN', metodo_pago: 'TRANSFERENCIA', referencia_operacion: '', periodo_inicio: '', periodo_fin: '' }

// role: 'ADMINISTRADOR' | 'EMPRESA' | 'PROFESOR'
export default function PagosPanel({ role }) {
  const puedeRegistrar = role === 'ADMINISTRADOR' || role === 'EMPRESA'
  const esAdmin = role === 'ADMINISTRADOR'
  const [data, setData] = useState({ pagos: [], resumen: null })
  const [docentes, setDocentes] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const fileRef = useRef(null)
  const targetId = useRef(null)

  const load = useCallback(async () => {
    try {
      const q = filtro ? `?estado=${filtro}` : ''
      setData(await apiFetch(`/api/pagos${q}`))
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [filtro])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (puedeRegistrar) apiFetch('/api/pagos/docentes').then(setDocentes).catch(e => setError(e.message)) }, [puedeRegistrar])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault(); setError(''); setOk(''); setSaving(true)
    try {
      const { modalidad, ...rest } = form
      const body = { ...rest, monto: modalidad === 'MONTO' ? Number(form.monto) : undefined, horas: modalidad === 'HORAS' ? Number(form.horas) : undefined, periodo_inicio: form.periodo_inicio || null, periodo_fin: form.periodo_fin || null }
      await apiPost('/api/pagos', body)
      setOk('Pago registrado. Adjunta el comprobante para poder confirmarlo.')
      setForm(EMPTY); load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  function pickFile(id) { targetId.current = id; fileRef.current?.click() }

  async function onFile(e) {
    const file = e.target.files?.[0]; e.target.value = ''
    const id = targetId.current
    if (!file || !id) return
    setError(''); setOk('')
    if (!TIPOS.includes(file.type)) return setError('Formato no permitido. Usa PDF, JPG, PNG o WEBP.')
    if (file.size > MAX_BYTES) return setError('El archivo supera los 5 MB.')
    setBusyId(id)
    try {
      const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '')
      const nombre = `comprobante-${Date.now()}.${ext}`
      const path = `pagos/${id}/${nombre}`
      const { error: upErr } = await supabase.storage.from('comprobantes-pagos').upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) throw upErr
      await apiPost(`/api/pagos/${id}/comprobante`, { path, nombre: file.name.slice(0, 120) })
      setOk('Comprobante adjuntado correctamente.'); load()
    } catch (err) { setError(err.message) } finally { setBusyId(null) }
  }

  async function verComprobante(id) {
    setError('')
    try { const r = await apiFetch(`/api/pagos/${id}/comprobante`); window.open(r.url, '_blank', 'noopener,noreferrer') }
    catch (err) { setError(err.message) }
  }

  async function marcarPagado(p) {
    const fecha = window.prompt('Fecha de pago (AAAA-MM-DD):', new Date().toISOString().slice(0, 10))
    if (!fecha) return
    setBusyId(p.id); setError(''); setOk('')
    try { await apiPatch(`/api/pagos/${p.id}/estado`, { estado: 'PAGADO', fecha_pago: fecha }); setOk('Pago confirmado.'); load() }
    catch (err) { setError(err.message) } finally { setBusyId(null) }
  }
  async function anular(p) {
    const motivo = window.prompt('Motivo de la anulación (mínimo 5 caracteres):')
    if (!motivo) return
    setBusyId(p.id); setError(''); setOk('')
    try { await apiPatch(`/api/pagos/${p.id}/estado`, { estado: 'ANULADO', motivo }); setOk('Pago anulado.'); load() }
    catch (err) { setError(err.message) } finally { setBusyId(null) }
  }

  const r = data.resumen
  return <Panel title="Pagos a docentes" subtitle={role === 'PROFESOR' ? 'Historial de tus honorarios' : 'Registro de honorarios y comprobantes'}>
    <ErrorBox text={error}/><OkBox text={ok}/>
    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={onFile}/>

    {r && <div className="grid sm:grid-cols-3 gap-4 mb-6">
      {[['Pagado', r.monto_pagado], ['Pendiente', r.monto_pendiente], ['Vencido', r.monto_vencido]].map(([t, v]) =>
        <div key={t} className="bg-slate-50 rounded-xl p-4"><div className="text-xs font-black text-slate-400 uppercase tracking-wider">{t}</div><div className="text-2xl font-black mt-1">{formatMoney(v)}</div></div>)}
    </div>}

    {puedeRegistrar && <form onSubmit={submit} className="grid md:grid-cols-3 gap-4 bg-slate-50 rounded-2xl p-5 mb-8">
      <Field label="Docente"><select required value={form.docente_id} onChange={set('docente_id')} className={inputCls}><option value="">Selecciona</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></Field>
      <div className="md:col-span-2"><Field label="Concepto"><input required minLength={3} maxLength={200} value={form.concepto} onChange={set('concepto')} placeholder="Honorarios septiembre 2026" className={inputCls}/></Field></div>
      <Field label="Cálculo"><select value={form.modalidad} onChange={set('modalidad')} className={inputCls}><option value="MONTO">Monto fijo</option><option value="HORAS">Horas × tarifa vigente</option></select></Field>
      {form.modalidad === 'MONTO'
        ? <Field label="Monto"><input required type="number" min="0.01" max="100000" step="0.01" value={form.monto} onChange={set('monto')} className={inputCls}/></Field>
        : <Field label="Horas dictadas"><input required type="number" min="0.01" max="300" step="0.01" value={form.horas} onChange={set('horas')} className={inputCls}/></Field>}
      <Field label="Moneda"><select value={form.moneda} onChange={set('moneda')} className={inputCls}><option value="PEN">PEN (S/)</option><option value="USD">USD ($)</option></select></Field>
      <Field label="Método de pago"><select value={form.metodo_pago} onChange={set('metodo_pago')} className={inputCls}>{METODOS.map(m => <option key={m}>{m}</option>)}</select></Field>
      <Field label="Periodo desde"><input type="date" value={form.periodo_inicio} onChange={set('periodo_inicio')} className={inputCls}/></Field>
      <Field label="Periodo hasta"><input type="date" min={form.periodo_inicio || undefined} value={form.periodo_fin} onChange={set('periodo_fin')} className={inputCls}/></Field>
      <Field label="N.º de operación"><input maxLength={60} value={form.referencia_operacion} onChange={set('referencia_operacion')} className={inputCls}/></Field>
      <div className="md:col-span-3"><button disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>} Registrar pago</button></div>
    </form>}

    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {['', 'PENDIENTE', 'PAGADO', 'VENCIDO', 'ANULADO'].map(f => <button key={f || 'todos'} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtro === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{f || 'Todos'}</button>)}
    </div>

    {loading ? <Empty text="Cargando pagos..."/> : <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead><tr className="text-xs text-slate-400 border-b uppercase tracking-wider">{['Docente', 'Concepto', 'Monto', 'Método', 'Estado', 'Fecha pago', 'Acciones'].map(h => <th key={h} className="py-3 pr-4">{h}</th>)}</tr></thead>
        <tbody>{data.pagos.map(p => <tr key={p.id} className="border-b border-slate-100 align-top">
          <td className="py-4 pr-4 font-bold">{p.docente_nombre || '-'}</td>
          <td className="py-4 pr-4 text-sm">{p.concepto}</td>
          <td className="py-4 pr-4 font-bold whitespace-nowrap">{formatMoney(p.monto, p.moneda)}{p.horas && <div className="text-xs font-normal text-slate-400">{p.horas} h × {formatMoney(p.tarifa_hora, p.moneda)}</div>}</td>
          <td className="py-4 pr-4 text-sm">{p.metodo_pago}</td>
          <td className="py-4 pr-4"><Badge value={p.estado}/></td>
          <td className="py-4 pr-4 text-sm whitespace-nowrap">{formatDay(p.fecha_pago)}</td>
          <td className="py-4 pr-4"><div className="flex gap-2 flex-wrap">
            {p.tiene_comprobante && <button onClick={() => verComprobante(p.id)} className={`${btnGhost} inline-flex items-center gap-1`}><Eye size={13}/> Comprobante</button>}
            {puedeRegistrar && p.estado !== 'ANULADO' && <button disabled={busyId === p.id} onClick={() => pickFile(p.id)} className={`${btnGhost} inline-flex items-center gap-1`}><Paperclip size={13}/> {p.tiene_comprobante ? 'Reemplazar' : 'Adjuntar'}</button>}
            {esAdmin && ['PENDIENTE', 'VENCIDO'].includes(p.estado) && <button disabled={busyId === p.id} onClick={() => marcarPagado(p)} className={`${btnGhost} inline-flex items-center gap-1 text-emerald-700`}><CheckCircle2 size={13}/> Confirmar</button>}
            {esAdmin && p.estado !== 'ANULADO' && <button disabled={busyId === p.id} onClick={() => anular(p)} className={`${btnGhost} inline-flex items-center gap-1 text-red-600`}><Ban size={13}/> Anular</button>}
          </div></td>
        </tr>)}</tbody>
      </table>
      {!data.pagos.length && <Empty text="No hay pagos registrados."/>}
    </div>}
  </Panel>
}
