import React from 'react'
import { Loader2 } from 'lucide-react'

export function Panel({ title, subtitle, children, action }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow">
    <div className="flex flex-wrap items-start gap-3 mb-6">
      <div><h2 className="text-2xl font-black">{title}</h2>{subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}</div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
    {children}
  </div>
}

export function Metric({ title, value, Icon }) {
  return <div className="bg-white border border-slate-200 rounded-2xl p-6 card-shadow">
    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center"><Icon/></div>
    <div className="mt-5 text-3xl font-black">{value}</div><div className="text-slate-500 mt-1">{title}</div>
  </div>
}

export function Empty({ text }) { return <div className="text-slate-400 py-7 text-center">{text}</div> }
export function Loading({ text = 'Cargando...' }) { return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="flex items-center gap-3 text-slate-500 font-semibold"><Loader2 className="animate-spin"/> {text}</div></div> }
export function ErrorBox({ text }) { return text ? <div role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{text}</div> : null }
export function OkBox({ text }) { return text ? <div role="status" className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4">{text}</div> : null }

const BADGES = {
  PAGADO: 'bg-emerald-50 text-emerald-700', PENDIENTE: 'bg-amber-50 text-amber-700', VENCIDO: 'bg-red-50 text-red-700', ANULADO: 'bg-slate-100 text-slate-500',
  PROGRAMADA: 'bg-blue-50 text-blue-700', EN_CURSO: 'bg-violet-50 text-violet-700', FINALIZADA: 'bg-slate-100 text-slate-500', CANCELADA: 'bg-red-50 text-red-700',
  ACTIVA: 'bg-emerald-50 text-emerald-700', BORRADOR: 'bg-slate-100 text-slate-500', PUBLICADA: 'bg-emerald-50 text-emerald-700', ERROR: 'bg-red-50 text-red-700'
}
export function Badge({ value }) { return <span className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${BADGES[value] || 'bg-slate-100 text-slate-600'}`}>{String(value).replace('_', ' ')}</span> }

export function Table({ headers, rows, emptyText = 'No hay registros todavía.' }) {
  return <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead><tr className="text-xs text-slate-400 border-b uppercase tracking-wider">{headers.map(h => <th key={h} className="py-3 pr-4">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-slate-100">{r.map((cell, j) => <td key={j} className={`py-4 pr-4 ${j === 0 ? 'font-bold' : ''}`}>{cell}</td>)}</tr>)}</tbody>
    </table>
    {!rows.length && <Empty text={emptyText}/>}
  </div>
}

export function Field({ label, children }) {
  return <label className="block"><span className="text-sm font-bold text-slate-700">{label}</span><div className="mt-1.5">{children}</div></label>
}
export const inputCls = 'w-full border border-slate-200 rounded-xl py-2.5 px-3.5 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-200'
export const btnPrimary = 'px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-sm inline-flex items-center gap-2'
export const btnGhost = 'px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-bold text-xs'

export function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
export function formatDay(value) {
  if (!value) return '-'
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(y, m - 1, d))
}
export function formatMoney(value, moneda = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(Number(value || 0))
}
