import { Building2, CheckCircle2, Power, PowerOff, RefreshCw, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'

const emptyForm = { group_name: '', branch_code: '', branch_name: '', school_id: '' }

export default function BranchManagement() {
  const [rows, setRows] = useState([])
  const [schools, setSchools] = useState([])
  const [summary, setSummary] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const groups = useMemo(() => [...new Set(rows.map(row => row.group_name).filter(Boolean))], [rows])

  async function load() {
    setBusy(true)
    setError('')
    try {
      const [branchResult, schoolResult] = await Promise.all([schoolApi.branches(), schoolApi.schools()])
      const branchRows = branchResult.data || []
      setRows(branchRows)
      setSchools(schoolResult.schools || schoolResult.data || [])
      const nextGroup = groupName || branchRows[0]?.group_name || ''
      if (nextGroup) {
        const consolidated = await schoolApi.consolidatedBranches(nextGroup)
        setSummary(consolidated.summary || null)
      } else {
        setSummary(null)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [])

  async function chooseGroup(value) {
    setGroupName(value)
    if (!value) { setSummary(null); return }
    setBusy(true)
    try {
      const result = await schoolApi.consolidatedBranches(value)
      setSummary(result.summary || null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function create(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await schoolApi.createBranch({ ...form, school_id: Number(form.school_id) })
      setMessage(result.message || 'Branch mapping created.')
      setForm(emptyForm)
      setGroupName(form.group_name)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(row) {
    setBusy(true)
    setError('')
    try {
      const result = await schoolApi.updateBranchStatus(row.id, row.status === 'active' ? 'inactive' : 'active')
      setMessage(result.message || 'Branch status updated.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="branch-management">
    <section className="people-hero"><div><span>Multi-branch control</span><h2>School group branches</h2><p>Map existing school tenants to a group and review safe consolidated operating counts.</p></div><Building2 /></section>
    {error && <div className="form-error" role="alert">{error}</div>}
    {message && <div className="success-notice" role="status">{message}</div>}
    <section className="editor-card">
      <div className="editor-heading"><Building2 /><div><h3>Register a branch</h3><p>Each school tenant can be mapped to one branch code.</p></div></div>
      <form className="field-grid four" onSubmit={create}>
        <label>Group name *<input required maxLength="120" value={form.group_name} onChange={event => setForm({ ...form, group_name: event.target.value })} placeholder="Sunrise Education Group" /></label>
        <label>Branch code *<input required maxLength="40" value={form.branch_code} onChange={event => setForm({ ...form, branch_code: event.target.value.toUpperCase() })} placeholder="DELHI" /></label>
        <label>Branch name *<input required maxLength="150" value={form.branch_name} onChange={event => setForm({ ...form, branch_name: event.target.value })} placeholder="Delhi Campus" /></label>
        <label>School tenant *<select required value={form.school_id} onChange={event => setForm({ ...form, school_id: event.target.value })}><option value="">Select a school</option>{schools.map(school => <option key={school.id} value={school.id}>{school.schoolName || school.name} · {school.domain}</option>)}</select></label>
        <button className="button button-small" disabled={busy}><Save size={16} />{busy ? 'Saving...' : 'Add branch'}</button>
      </form>
    </section>
    {summary && <section className="stat-grid branch-summary"><article><small>Active branches</small><b>{summary.branches || 0}</b><span>{summary.group_name}</span></article><article><small>Students</small><b>{summary.students || 0}</b><span>across active branches</span></article><article><small>Teachers</small><b>{summary.teachers || 0}</b><span>across active branches</span></article><article><small>Classes</small><b>{summary.classes || 0}</b><span>across active branches</span></article><article><small>Users</small><b>{summary.users || 0}</b><span>tenant accounts</span></article></section>}
    <section className="data-panel"><div className="panel-title"><div><span>Branch directory</span><h2>Mapped school tenants</h2></div><div className="panel-title-actions"><label>Group<select value={groupName} onChange={event => chooseGroup(event.target.value)}><option value="">All groups</option>{groups.map(group => <option key={group}>{group}</option>)}</select></label><button className="refresh-button" onClick={load} disabled={busy}><RefreshCw size={15} />Refresh</button></div></div><div className="table-wrap"><table><thead><tr><th>Group / branch</th><th>School tenant</th><th>Plan</th><th>Status</th><th>Consolidated counts</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.branch_name}</b><small>{row.group_name} · {row.branch_code}</small></td><td>{row.school_name}<small>{row.school_domain}</small></td><td>{row.school_plan || 'standard'}</td><td><span className={'status-pill ' + (row.status === 'inactive' ? 'inactive' : '')}>{row.status}</span></td><td>{row.group_name === groupName && summary ? String(summary.students || 0) + ' students · ' + String(summary.teachers || 0) + ' teachers' : 'Select group'}</td><td><button className={row.status === 'active' ? 'danger' : 'activate'} onClick={() => toggle(row)} disabled={busy}>{row.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}{row.status === 'active' ? 'Deactivate' : 'Activate'}</button></td></tr>)}{!rows.length && <tr><td colSpan="6"><div className="empty-state"><CheckCircle2 /><h3>No branch mappings</h3><p>Register a school tenant above to start a group directory.</p></div></td></tr>}</tbody></table></div></section>
    <p className="branch-safety-note">Branch management groups existing tenants for reporting. Tenant isolation remains enforced by each school schema and its existing API authorization.</p>
  </div>
}
