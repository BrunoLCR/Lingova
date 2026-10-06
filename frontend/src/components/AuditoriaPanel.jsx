import React, { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { apiFetch } from '../lib/api.js'
import { Panel, Table, ErrorBox, btnPrimary, formatDate } from './ui.jsx'

export default function AuditoriaPanel() {
  const [eventos, setEventos] = useState([])
  const [resultado, setResultado] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { apiFetch('/api/admin/auditoria?limit=50').then(setEventos).catch(e => setError(e.message)) }, [])

  async function verificar() {
    setVerificando(true); setError('')
    try { setResultado(await apiFetch('/api/admin/auditoria/verificar')); setEventos(await apiFetch('/api/admin/auditoria?limit=50')) }
    catch (e) { setError(e.message) } finally { setVerificando(false) }
  }

  return <Panel title="Auditoría inmutable" subtitle="Registro append-only encadenado con SHA-256"
    action={<button onClick={verificar} disabled={verificando} className={btnPrimary}>{verificando ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>} Verificar integridad</button>}>
    <ErrorBox text={error}/>
    {resultado && <div role="status" className={`mb-6 rounded-xl p-4 border flex items-start gap-3 ${resultado.integra ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {resultado.integra ? <ShieldCheck className="shrink-0"/> : <ShieldAlert className="shrink-0"/>}
      <div><b>{resultado.integra ? 'Cadena íntegra' : `Se detectaron ${resultado.alterados.length} eventos alterados`}</b>
        <div className="text-sm">{resultado.eventos_verificados} eventos verificados con {resultado.algoritmo}.{resultado.alterados.map(a => ` Evento #${a.evento_id}: ${a.motivo}.`)}</div></div>
    </div>}
    <Table headers={['#', 'Evento', 'Rol', 'Descripción', 'Hash (SHA-256)', 'Fecha']}
      rows={eventos.map(a => [a.id, a.tipo_evento, a.rol_usuario || '-', a.descripcion || '-', <code key={a.id} className="text-xs text-slate-500" title={a.hash_integridad}>{a.hash_integridad.slice(0, 12)}…</code>, formatDate(a.created_at)])}/>
  </Panel>
}
