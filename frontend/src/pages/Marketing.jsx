import React, { useEffect, useState } from 'react'
import { Home, Megaphone, CalendarClock, CheckCircle2, FileText } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.jsx'
import { apiFetch } from '../lib/api.js'
import { Panel, Metric, Table, Badge, Loading, ErrorBox, formatDate } from '../components/ui.jsx'

const items = [
  { key: 'resumen', label: 'Resumen', icon: Home },
  { key: 'publicaciones', label: 'Publicaciones', icon: Megaphone }
]

export default function Marketing({ profile, onLogout }) {
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { apiFetch('/api/marketing/dashboard').then(setData).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  if (loading) return <Loading text="Cargando panel de marketing..."/>

  const posts = data?.posts || []
  return <DashboardShell title="Panel de marketing" subtitle="Calendario de publicaciones de Instagram" role="Marketing" name={data?.profile?.full_name || profile?.full_name} items={items} active={section} onSection={setSection} onLogout={onLogout}>
    <ErrorBox text={error}/>
    {section === 'resumen' && <>
      <div className="grid sm:grid-cols-3 gap-5">
        <Metric title="Publicaciones" value={data?.counts?.total || 0} Icon={FileText}/>
        <Metric title="Programadas" value={data?.counts?.programadas || 0} Icon={CalendarClock}/>
        <Metric title="Publicadas" value={data?.counts?.publicadas || 0} Icon={CheckCircle2}/>
      </div>
      <div className="mt-6 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-5">La integración con Instagram Graph API está planificada para el Sprint 6; en esta versión el rol cuenta con acceso protegido por RBAC y su modelo de datos.</div>
    </>}
    {section === 'publicaciones' && <Panel title="Publicaciones" subtitle="Contenido planificado para Instagram">
      <Table headers={['Título', 'Estado', 'Programada para']} rows={posts.map(p => [p.titulo, <Badge key={p.id} value={p.estado}/>, formatDate(p.programada_para)])}/>
    </Panel>}
  </DashboardShell>
}
