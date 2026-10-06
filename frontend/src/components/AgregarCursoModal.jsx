import React, { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, CreditCard, GraduationCap, UserRound, ChevronLeft } from 'lucide-react'
import { apiFetch, apiPost } from '../lib/api.js'
import { ErrorBox, btnPrimary, btnGhost, formatMoney } from './ui.jsx'

const METODOS = [
  { id: 'TARJETA', label: 'Tarjeta de crédito/débito' },
  { id: 'YAPE', label: 'Yape' },
  { id: 'PLIN', label: 'Plin' }
]
const PASOS = ['Curso', 'Docente', 'Pago', 'Listo']

// Flujo: 1) elegir curso → 2) elegir docente → 3) pago SIMULADO → 4) confirmación.
// Al confirmar, el backend inserta la matrícula en `enrollments` (función matricular_estudiante).
export default function AgregarCursoModal({ onClose, onDone, cursoInicial = null }) {
  const [paso, setPaso] = useState(1)
  const [catalogo, setCatalogo] = useState(null)
  const [curso, setCurso] = useState(null)
  const [docente, setDocente] = useState(null)
  const [metodo, setMetodo] = useState('TARJETA')
  const [acepta, setAcepta] = useState(false)
  const [pagando, setPagando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const n = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    apiFetch('/api/student/catalogo').then(r => {
      setCatalogo(r)
      if (cursoInicial) { // viene de "Matricularme" en la Landing: salta al paso del docente
        const c = r.cursos.find(x => n(x.nombre) === n(cursoInicial) && !x.ya_matriculado)
        if (c) { setCurso(c); setDocente(c.docentes.length === 1 ? c.docentes[0] : null); setPaso(2) }
      }
    }).catch(e => setError(e.message))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !pagando) cerrar() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })

  function cerrar() { if (resultado) onDone(resultado); else onClose() }

  async function pagar() {
    setError(''); setPagando(true)
    try {
      await new Promise(r => setTimeout(r, 900)) // simula el procesamiento del pago
      const r = await apiPost('/api/student/matricular', { curso_id: curso.id, docente_id: docente.id, metodo_pago: metodo })
      setResultado(r); setPaso(4)
    } catch (e) { setError(e.message) } finally { setPagando(false) }
  }

  return <div className="fixed inset-0 z-50 bg-slate-900/50 grid place-items-center p-4" onClick={e => { if (e.target === e.currentTarget && !pagando) cerrar() }}>
    <div role="dialog" aria-modal="true" aria-label="Agregar curso" className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto card-shadow">
      <div className="p-6 border-b border-slate-100 flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-2xl font-black">Agregar curso</h2>
          <ol className="flex flex-wrap gap-2 mt-3">{PASOS.map((n, i) => <li key={n} className={`text-xs font-bold px-3 py-1.5 rounded-full ${paso === i + 1 ? 'bg-blue-600 text-white' : paso > i + 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{i + 1}. {n}</li>)}</ol>
        </div>
        <button onClick={cerrar} disabled={pagando} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-slate-100"><X size={20}/></button>
      </div>

      <div className="p-6">
        <ErrorBox text={error}/>

        {paso === 1 && (!catalogo ? <div className="py-10 text-center text-slate-400 flex justify-center gap-2"><Loader2 className="animate-spin"/> Cargando catálogo...</div> : <div className="grid gap-3">
          {catalogo.cursos.map(c => <button key={c.id} disabled={c.ya_matriculado} onClick={() => { setCurso(c); setDocente(c.docentes.length === 1 ? c.docentes[0] : null); setPaso(2) }}
            className={`text-left border rounded-2xl p-5 transition ${c.ya_matriculado ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50/40 border-slate-200'}`}>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center shrink-0"><GraduationCap/></div>
              <div className="flex-1"><div className="font-black">{c.nombre} <span className="text-xs font-bold text-slate-400 ml-1">{c.nivel}</span></div>
                <p className="text-sm text-slate-500 mt-1">{c.descripcion}</p>
                <div className="text-xs text-slate-400 mt-2">{c.docentes.length} docente(s) disponible(s)</div></div>
              <div className="text-right"><div className="font-black text-blue-700">{formatMoney(c.precio)}</div>{c.ya_matriculado && <div className="text-xs font-bold text-emerald-600 mt-1">Ya matriculado</div>}</div>
            </div>
          </button>)}
          {!catalogo.cursos.length && <div className="text-slate-400 text-center py-8">No hay cursos disponibles por ahora.</div>}
        </div>)}

        {paso === 2 && curso && <div>
          <p className="text-slate-500 mb-4">Elige al docente de <b className="text-slate-800">{curso.nombre}</b>:</p>
          <div className="grid gap-3">{curso.docentes.map(d => <label key={d.id} className={`flex items-center gap-4 border rounded-2xl p-4 cursor-pointer ${docente?.id === d.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
            <input type="radio" name="docente" checked={docente?.id === d.id} onChange={() => setDocente(d)} className="accent-blue-600"/>
            <div className="w-10 h-10 rounded-full bg-slate-100 grid place-items-center text-slate-500"><UserRound size={18}/></div>
            <div className="font-bold">{d.nombre}</div></label>)}</div>
          <div className="flex justify-between mt-6"><button onClick={() => setPaso(1)} className={`${btnGhost} inline-flex items-center gap-1`}><ChevronLeft size={14}/> Atrás</button>
            <button disabled={!docente} onClick={() => setPaso(3)} className={btnPrimary}>Continuar</button></div>
        </div>}

        {paso === 3 && curso && docente && <div>
          <div className="bg-slate-50 rounded-2xl p-5 mb-5">
            <div className="flex justify-between"><span className="text-slate-500">Curso</span><b>{curso.nombre}</b></div>
            <div className="flex justify-between mt-2"><span className="text-slate-500">Docente</span><b>{docente.nombre}</b></div>
            <div className="flex justify-between mt-3 pt-3 border-t border-slate-200 text-lg"><span className="font-bold">Total</span><b className="text-blue-700">{formatMoney(curso.precio)}</b></div>
          </div>
          <fieldset className="grid gap-2 mb-4"><legend className="text-sm font-bold text-slate-700 mb-2">Método de pago</legend>
            {METODOS.map(m => <label key={m.id} className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer ${metodo === m.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
              <input type="radio" name="metodo" checked={metodo === m.id} onChange={() => setMetodo(m.id)} className="accent-blue-600"/><CreditCard size={16} className="text-slate-400"/><span className="font-semibold">{m.label}</span></label>)}
          </fieldset>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-3 mb-4">Pago <b>simulado</b> con fines académicos: no se realiza ningún cobro ni se solicitan datos de tarjeta.</div>
          <label className="flex items-start gap-2 text-sm text-slate-600 mb-5"><input type="checkbox" checked={acepta} onChange={e => setAcepta(e.target.checked)} className="mt-1 accent-blue-600"/> Entiendo que es una simulación y deseo activar esta matrícula.</label>
          <div className="flex justify-between"><button disabled={pagando} onClick={() => setPaso(2)} className={`${btnGhost} inline-flex items-center gap-1`}><ChevronLeft size={14}/> Atrás</button>
            <button disabled={!acepta || pagando} onClick={pagar} className={btnPrimary}>{pagando ? <><Loader2 className="animate-spin" size={16}/> Procesando...</> : `Pagar ${formatMoney(curso.precio)} (simulado)`}</button></div>
        </div>}

        {paso === 4 && resultado && <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto"><CheckCircle2 size={34}/></div>
          <h3 className="text-xl font-black mt-4">¡Matrícula activada!</h3>
          <p className="text-slate-500 mt-2">Ya estás inscrito en <b>{resultado.curso}</b>. Se habilitaron tus secciones de <b>Clases, Notas y Certificados</b>.</p>
          <div className="bg-slate-50 rounded-xl p-4 mt-5 text-sm inline-block text-left">
            <div>Referencia (simulada): <b>{resultado.referencia}</b></div><div>Monto: <b>{formatMoney(resultado.monto)}</b> · {resultado.metodo_pago}</div></div>
          <div className="mt-6"><button onClick={() => onDone(resultado)} className={btnPrimary}>Ir a mis cursos</button></div>
        </div>}
      </div>
    </div>
  </div>
}
