import React, { useEffect, useState } from 'react'
import { Home, Users, Wallet, Building2, TrendingUp, Clock } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import PagosPanel from '../components/PagosPanel.jsx'
import { apiFetch } from '../lib/api.js'
import { Panel, Metric, Table, Loading, ErrorBox } from '../components/ui.jsx'

const items = [
  { key: 'resumen', label: 'Resumen', icon: Home },
  { key: 'personal', label: 'Personal', icon: Users },
  { key: 'pagos', label: 'Pagos a docentes', icon: Wallet }
]

export default function Empresa({ profile, onLogout }) {
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { apiFetch('/api/empresa/dashboard').then(setData).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  if (loading) return <Loading text="Cargando portal empresarial..."/>

  const personal = data?.personal || []
  const promedio = personal.length ? Math.round(personal.reduce((s, p) => s + p.progreso_promedio, 0) / personal.length) : 0
  return <DashboardShell title="Portal empresarial" subtitle={data?.empresa?.razon_social || 'Empresa cliente'} role="Empresa cliente" name={data?.profile?.full_name || profile?.full_name} items={items} active={section} onSection={setSection} onLogout={onLogout}>
    <ErrorBox text={error}/>
    {section === 'resumen' && <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <Metric title="Empresa" value={data?.empresa?.ruc || '-'} Icon={Building2}/>
      <Metric title="Personal en formación" value={personal.length} Icon={Users}/>
      <Metric title="Avance promedio" value={`${promedio}%`} Icon={TrendingUp}/>
      <Metric title="Pagos pendientes" value={data?.pagos_pendientes || 0} Icon={Clock}/>
    </div>}
    {section === 'personal' && <Panel title="Personal" subtitle="Avance académico de tu personal matriculado">
      <Table headers={['Nombre', 'Correo', 'Cursos', 'Avance']} rows={personal.map(p => [p.full_name, p.email, p.cursos, `${p.progreso_promedio}%`])}/>
    </Panel>}
    {section === 'pagos' && <PagosPanel role="EMPRESA"/>}
  </DashboardShell>
}
