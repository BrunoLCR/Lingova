import React, { useEffect, useState } from 'react'
import { Award, ClipboardList } from 'lucide-react'
import { apiFetch } from '../lib/api.js'
import { Panel, Badge, Empty, ErrorBox, btnGhost, formatDay } from './ui.jsx'

// modo = 'notas' | 'certificados'. Solo se muestra con matrícula activa (el padre bloquea la sección).
export default function NotasPanel({ modo }) {
  const [cursos, setCursos] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { apiFetch('/api/student/notas').then(r => setCursos(r.cursos)).catch(e => setError(e.message)) }, [])

  if (modo === 'notas') return <Panel title="Mis notas" subtitle="Calificaciones por curso (escala 0 a 20)">
    <ErrorBox text={error}/>
    {!cursos ? <Empty text="Cargando notas..."/> : !cursos.length ? <Empty text="Aún no hay cursos con notas."/> : <div className="space-y-6">
      {cursos.map(c => <div key={c.curso_id} className="border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 flex-wrap"><ClipboardList className="text-blue-600"/><div className="font-black text-lg">{c.curso}</div>
          <div className="ml-auto text-sm text-slate-500">Promedio: <b className="text-slate-900 text-lg">{c.promedio ?? '-'}</b></div></div>
        <table className="w-full text-left mt-4"><thead><tr className="text-xs text-slate-400 uppercase tracking-wider border-b"><th className="py-2">Evaluación</th><th>Fecha límite</th><th className="text-right">Nota</th></tr></thead>
          <tbody>{c.evaluaciones.map(e => <tr key={e.id} className="border-b border-slate-100"><td className="py-3 font-semibold">{e.titulo}</td><td className="text-sm text-slate-500">{formatDay(e.fecha_limite)}</td>
            <td className="text-right font-bold">{e.calificada ? `${e.nota} / ${e.puntaje_max}` : <span className="text-slate-400 font-normal">Pendiente</span>}</td></tr>)}</tbody></table>
        {!c.evaluaciones.length && <Empty text="Este curso aún no tiene evaluaciones."/>}
      </div>)}
    </div>}
  </Panel>

  return <Panel title="Mis certificados" subtitle="Requisito: progreso 100 % y promedio mínimo de 11/20">
    <ErrorBox text={error}/>
    {!cursos ? <Empty text="Cargando..."/> : !cursos.length ? <Empty text="Aún no hay cursos."/> : <div className="grid md:grid-cols-2 gap-4">
      {cursos.map(c => <div key={c.curso_id} className="border border-slate-200 rounded-2xl p-5">
        <div className="flex items-start gap-3"><div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><Award/></div>
          <div className="flex-1"><div className="font-black">{c.curso}</div><div className="text-sm text-slate-500">Progreso {c.progreso}% · Promedio {c.promedio ?? '-'}</div></div>
          <Badge value={c.certificado.estado === 'ELEGIBLE' ? 'ACTIVA' : 'PENDIENTE'}/></div>
        <p className="text-sm text-slate-500 mt-4">{c.certificado.elegible ? 'Cumples los requisitos. La emisión del certificado PDF con código de verificación se habilitará en el Sprint 5.' : c.certificado.requisitos}</p>
        <button disabled className={`${btnGhost} mt-4`}>Descargar certificado (próximamente)</button>
      </div>)}
    </div>}
  </Panel>
}
