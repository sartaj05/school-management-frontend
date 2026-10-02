import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, HardDrive, RefreshCw, Server, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const statusClass = status => status === 'ok' || status === 'ready' ? 'ready' : status === 'failed' || status === 'degraded' ? 'failed' : 'pending'

function StatusBadge({ status }) {
  const ready = status === 'ok' || status === 'ready'
  return <span className={`operations-status ${statusClass(status)}`}>{ready ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>} {status || 'pending'}</span>
}

export default function OperationsDashboard() {
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setBusy(true); setError('')
    try { setReport(await schoolApi.operationsStatus()) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const data = report?.data || {}
  const tenants = data.tenants || {}
  const backup = data.backup || {}
  const workers = data.workers || {}
  const workerSchedule = data.worker_schedule || {}
  const restore = data.restore_verification || {}
  const classroom = data.smart_classroom || {}
  const checks = data.readiness?.checks || []

  return <section className="operations-dashboard">
    <div className="maintenance-hero operations-hero"><Activity/><div><span>Production operations</span><h2>Monitoring and backup control</h2><p>Read-only release health for the API, workers, tenant schemas and database backups.</p></div><button className="button button-small" onClick={load} disabled={busy}><RefreshCw size={15}/>{busy ? 'Refreshing...' : 'Refresh status'}</button></div>
    {error && <div className="form-error">{error}</div>}
    {report && <>
      <div className="stat-grid compact operations-stat-grid">
        <article><small>API / database</small><b><StatusBadge status={data.status === 'degraded' ? 'degraded' : data.database?.status}/></b><span>{data.database?.latency_ms ?? '—'} ms database check</span></article>
        <article><small>Worker runs</small><b>{workers.total_runs || 0}</b><span>{workers.failed_runs || 0} failed runs</span></article>
        <article><small>Backups</small><b><StatusBadge status={backup.status}/></b><span>{backup.backup_count || 0} archive(s) found</span></article>
        <article><small>Tenant migrations</small><b>{tenants.ready || 0}/{tenants.total || 0}</b><span>{tenants.pending || 0} pending schemas</span></article>
        <article><small>Classroom media</small><b><StatusBadge status={classroom.status}/></b><span>{classroom.queued || 0} queued · {classroom.failed || 0} failed</span></article>
      </div>
      <div className="settings-columns operations-columns">
        <section className="data-panel"><div className="panel-title"><div><span>Database protection</span><h3>Backup status</h3></div><HardDrive/></div><dl className="operations-details"><div><dt>Latest archive</dt><dd>{backup.latest_file || 'Not created'}</dd></div><div><dt>Last created</dt><dd>{backup.latest_at ? new Date(backup.latest_at).toLocaleString() : '—'}</dd></div><div><dt>Archive verification</dt><dd>{backup.verified_at ? new Date(backup.verified_at).toLocaleString() : 'Pending'}</dd></div><div><dt>Retention</dt><dd>{backup.retention || 7} archive(s)</dd></div><div><dt>Restore drill</dt><dd><StatusBadge status={restore.status}/></dd></div></dl><p className="field-help">Run <code>flask backup-database</code>, then <code>flask verify-backup &lt;file&gt;</code>. Record <code>BACKUP_LAST_RESTORE_AT</code> after a verified restore drill.</p></section>
        <section className="data-panel"><div className="panel-title"><div><span>Worker and logging</span><h3>Runtime operations</h3></div><Server/></div><div className="operations-check-list"><div><span>Structured request logs</span><StatusBadge status={data.structured_logs?.status}/></div><div><span>Scheduled worker endpoint</span><StatusBadge status={workerSchedule.status}/><small>Every {workerSchedule.interval_minutes || 5} minute(s)</small></div><div><span>Notification worker</span><StatusBadge status={workers.status}/></div></div><p className="field-help">Request IDs use <code>X-Request-ID</code>. Failed worker runs remain visible for investigation.</p></section>
        <section className="data-panel"><div className="panel-title"><div><span>Media and retention</span><h3>Smart Classroom</h3></div><HardDrive/></div><div className="operations-check-list"><div><span>Media pipeline</span><StatusBadge status={classroom.status}/><small>{classroom.ready || 0} ready · {classroom.processing || 0} processing · {classroom.failed || 0} failed</small></div><div><span>Storage backends</span><strong>{classroom.storage_backends?.length ? classroom.storage_backends.join(', ') : 'No media recorded'}</strong></div><div><span>Retention cleanup</span><StatusBadge status={classroom.retention_cleanup_required ? 'pending' : 'ok'}/><small>{classroom.expired || 0} expired recording(s) require cleanup</small></div></div><p className="field-help">Preview with <code>flask cleanup-smart-classroom --dry-run</code>, then run the scheduled cleanup after review.</p></section>
        <section className="data-panel"><div className="panel-title"><div><span>Recovery evidence</span><h3>Restore verification</h3></div><RefreshCw/></div><div className="operations-check-list"><div><span>Latest restore drill</span><StatusBadge status={restore.status}/><small>{restore.verified_at ? new Date(restore.verified_at).toLocaleString() : restore.message}</small></div></div><p className="field-help">Keep restore verification separate from backup creation so a readable archive is also proven recoverable.</p></section>
      </div>
      <section className="data-panel operations-table-panel"><div className="panel-title"><div><span>Tenant safety</span><h3>Migration readiness</h3></div><ShieldCheck/></div><div className="table-wrap"><table><thead><tr><th>School</th><th>Schema</th><th>Status</th><th>Missing compatibility tables</th></tr></thead><tbody>{(tenants.migrations || []).map(item => <tr key={item.id}><td>{item.name}</td><td>{item.schema_name}</td><td><StatusBadge status={item.status}/></td><td>{item.missing_tables?.length ? item.missing_tables.join(', ') : 'None'}</td></tr>)}</tbody></table></div>{!tenants.migrations?.length && <div className="empty-state"><Database/><h3>No active tenant schemas</h3></div>}</section>
      <section className="data-panel operations-table-panel"><div className="panel-title"><div><span>Background activity</span><h3>Latest worker runs</h3></div><Clock3/></div><div className="table-wrap"><table><thead><tr><th>School</th><th>Started</th><th>Status</th><th>Selected</th><th>Sent</th><th>Retrying</th><th>Failed</th></tr></thead><tbody>{(workers.latest || []).map((run, index) => <tr key={`${run.school_id}-${run.started_at}-${index}`}><td>{run.school_name}</td><td>{run.started_at ? new Date(run.started_at).toLocaleString() : '—'}</td><td><StatusBadge status={run.status}/></td><td>{run.selected || 0}</td><td>{run.sent || 0}</td><td>{run.retrying || 0}</td><td>{run.failed || 0}</td></tr>)}</tbody></table></div>{!workers.latest?.length && <div className="empty-state"><Clock3/><h3>No worker runs recorded</h3><p>Configure the scheduled worker to begin collecting runtime history.</p></div>}</section>
      <section className="data-panel operations-readiness"><div className="panel-title"><div><span>Release gate</span><h3>Readiness checks</h3></div><StatusBadge status={data.readiness?.status}/></div><div className="operations-check-list">{checks.map(check => <div key={check.name}><span>{check.name.replaceAll('_', ' ')}</span><StatusBadge status={check.status}/><small>{check.message}</small></div>)}</div></section>
    </>}
  </section>
}
