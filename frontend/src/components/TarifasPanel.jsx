import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { apiFetch, apiPost } from '../lib/api.js'
import { Panel, Table, Badge, ErrorBox, OkBox, Field, inputCls, btnPrimary, formatMoney, formatDay } from './ui.jsx'

// Tarifas por hora de docentes (solo ADMINISTRADOR puede definirlas; permiso tarifas:gestionar)
export default function TarifasPanel() {
  const [tarifas, setTarifas] = useState([])
  const [docentes, setDocentes] = useState([])
  const [form, setForm] = useState({ docente_id: '', tarifa_hora: '', moneda: 'PEN', vigente_desde: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(() => apiFetch('/api/tarifas').then(setTarifas).catch(e => setError(e.message)), [])
  useEffect(() => { load(); apiFetch('/api/pagos/docentes').then(setDocentes).catch(e => setError(e.message)) }, [load])
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault(); setError(''); setOk(''); setSaving(true)
    try {
      await apiPost('/api/tarifas', { ...form, tarifa_hora: Number(form.tarifa_hora), vigente_desde: form.vigente_desde || undefined })
      setOk('Tarifa registrada. La anterior quedó cerrada.'); setForm(f => ({ ...f, tarifa_hora: '' })); load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return <Panel title="Tarifas por hora" subtitle="Histórico de tarifas de los docentes">
    <ErrorBox text={error}/><OkBox text={ok}/>
    <form onSubmit={submit} className="grid md:grid-cols-4 gap-4 bg-slate-50 rounded-2xl p-5 mb-8">
      <Field label="Docente"><select required value={form.docente_id} onChange={set('docente_id')} className={inputCls}><option value="">Selecciona</option>{docentes.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></Field>
      <Field label="Tarifa por hora"><input required type="number" min="0.01" max="5000" step="0.01" value={form.tarifa_hora} onChange={set('tarifa_hora')} className={inputCls}/></Field>
      <Field label="Moneda"><select value={form.moneda} onChange={set('moneda')} className={inputCls}><option value="PEN">PEN</option><option value="USD">USD</option></select></Field>
      <Field label="Vigente desde"><input type="date" value={form.vigente_desde} onChange={set('vigente_desde')} className={inputCls}/></Field>
      <div className="md:col-span-4"><button disabled={saving} className={btnPrimary}>{saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Guardar tarifa</button></div>
    </form>
    <Table headers={['Docente', 'Tarifa/hora', 'Desde', 'Hasta', 'Estado']}
      rows={tarifas.map(t => [t.docente_nombre || '-', formatMoney(t.tarifa_hora, t.moneda), formatDay(t.vigente_desde), t.vigente_hasta ? formatDay(t.vigente_hasta) : '-', <Badge key={t.id} value={t.vigente ? 'ACTIVA' : 'FINALIZADA'}/>])}/>
  </Panel>
}
