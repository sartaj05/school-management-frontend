import { Activity, Filter, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 16)

function when(value) {
  return value ? new Date(value).toLocaleString() : '-'
}

export default function AuditActivityLog() {
  const [summary, setSummary] = useState({ total: 0, last_24h: 0, actions: [], modules: [] })
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState({ action: 'all', entity_type: '', actor_role: '', actor_id: '', search: '', from: weekStart, to: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        const [summaryResult, eventsResult] = await Promise.all([
          schoolApi.auditSummary(),
          schoolApi.auditEvents({ ...filters, limit: 25, offset }),
        ])
        if (!active) return
        setSummary(summaryResult.data || {})
        setRows(eventsResult.data || [])
        setTotal(eventsResult.total || 0)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [filters, offset, refresh])

  function field(name, value) {
    setFilters(current => ({ ...current, [name]: value }))
    setOffset(0)
  }

  const actionCounts = Object.fromEntries((summary.actions || []).map(item => [item.action, item.count]))

  return <section className="audit-log-page">
    <section className="people-hero audit-hero"><div><span>Governance</span><h2>Audit logs and activity history</h2><p>Review successful changes across the school workspace.</p></div><ShieldCheck /></section>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="reference-stat-grid compact audit-stats">
      {[['Total events', summary.total || 0], ['Last 24 hours', summary.last_24h || 0], ['Creates', actionCounts.create || 0], ['Updates', actionCounts.update || 0]].map(([label, value]) => <article key={label}><span><Activity /></span><div><small>{label}</small><b>{value}</b><em>tenant activity</em></div></article>)}
    </div>
    <form className="editor-card audit-filter" onSubmit={event => { event.preventDefault(); setRefresh(value => value + 1) }}><div className="editor-heading"><Filter /><div><h3>Filter events</h3><p>Search by module, role, actor, endpoint or summary.</p></div></div><div className="field-grid three">
      <label>Action<select value={filters.action} onChange={e => field('action', e.target.value)}>{['all', 'create', 'update', 'delete'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Module<input value={filters.entity_type} onChange={e => field('entity_type', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="students" /></label>
      <label>Actor role<input value={filters.actor_role} onChange={e => field('actor_role', e.target.value)} placeholder="School Admin" /></label>
      <label>Actor ID<input type="number" min="1" value={filters.actor_id} onChange={e => field('actor_id', e.target.value)} /></label>
      <label>From<input type="datetime-local" value={filters.from} onChange={e => field('from', e.target.value)} /></label>
      <label>To<input type="datetime-local" value={filters.to} onChange={e => field('to', e.target.value)} /></label>
      <label className="wide">Search<input value={filters.search} onChange={e => field('search', e.target.value)} placeholder="/api/v1/student or update" /></label>
    </div><button className="button button-small" disabled={loading}>Refresh audit log</button></form>
    <section className="data-panel audit-table"><div className="panel-title"><div><span>Append-only events</span><h2>Activity history</h2></div><b>{total} records</b></div>{loading ? <div className="history-loading">Loading audit events...</div> : <div className="table-wrap"><table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Module</th><th>Request</th><th>Status</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{when(row.created_at)}<small>#{row.id}</small></td><td>{row.actor_name || `User #${row.actor_id || '-'}`}<small>{row.actor_role || row.actor_email || '-'}</small></td><td><span className={`delivery-status ${row.action}`}>{row.action}</span></td><td>{row.entity_type}<small>{row.entity_id ? `ID ${row.entity_id}` : '-'}</small></td><td><b>{row.method} {row.path}</b><small>{row.endpoint || row.summary}</small></td><td>{row.status_code}</td></tr>)}{!rows.length && <tr><td colSpan="6">No audit events match these filters.</td></tr>}</tbody></table></div>}<div className="page-actions"><button disabled={offset === 0 || loading} onClick={() => setOffset(value => Math.max(0, value - 25))}>Previous</button><span>Page {Math.floor(offset / 25) + 1}</span><button disabled={offset + 25 >= total || loading} onClick={() => setOffset(value => value + 25)}>Next</button></div></section>
  </section>
}
