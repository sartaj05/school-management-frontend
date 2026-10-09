import { KeyRound, RefreshCw, UserMinus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const roles = ['School Admin', 'Teacher', 'Accounts Staff', 'Driver', 'Hostel Staff']

export default function BranchAccessManagement({ branches = [] }) {
  const [branchId, setBranchId] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ tenant_user_id: '', access_role: 'School Admin' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const selectedBranchExists = branches.some(row => String(row.id) === branchId)
    if (branchId && !selectedBranchExists) {
      setRows([])
      setBranchId(branches[0]?.id ? String(branches[0].id) : '')
    } else if (!branchId && branches[0]?.id) {
      setBranchId(String(branches[0].id))
    }
  }, [branchId, branches])

  const load = useCallback(async () => {
    if (!branchId) return
    setBusy(true); setError('')
    try { const result = await schoolApi.branchAccess(branchId); setRows(result.data || []) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }, [branchId])
  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
      return () => clearTimeout(timer)
  }, [load])
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.saveBranchAccess(branchId, { tenant_user_id: Number(form.tenant_user_id), access_role: form.access_role }); setRows(result.data || []); setForm(current => ({ ...current, tenant_user_id: '' })); setMessage(result.message || 'Branch access saved.') } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  async function revoke(row) {
    setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.revokeBranchAccess(branchId, row.id); setMessage(result.message || 'Branch access revoked.'); await load() } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return <section className="data-panel branch-access-management">
    <div className="panel-title"><div><span>Branch permissions</span><h2>Staff access registry</h2></div><KeyRound /></div>
    <p className="branch-safety-note">The backend verifies the user and role inside the mapped school schema.</p>
    <div className="branch-access-controls">
      <label className="branch-access-branch">Branch
        <select value={branchId} onChange={event => { setBranchId(event.target.value); setRows([]); setError('') }}>
          <option value="">Select branch</option>
          {branches.map(row => <option key={row.id} value={row.id}>{row.branch_name} · {row.branch_code}</option>)}
        </select>
      </label>
      <form className="branch-access-form" onSubmit={save}>
        <label>Tenant user ID<input required type="number" min="1" value={form.tenant_user_id} onChange={event => setForm({ ...form, tenant_user_id: event.target.value })} /></label>
        <label>Role<select value={form.access_role} onChange={event => setForm({ ...form, access_role: event.target.value })}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
        <button className="button button-small" disabled={busy || !branchId}><UserPlus size={15} />{busy ? 'Saving...' : 'Save access'}</button>
      </form>
      <button className="refresh-button branch-access-refresh" type="button" onClick={() => load()} disabled={busy || !branchId}>
        <RefreshCw size={15} />{busy ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
    {error && <div className="form-error branch-access-message" role="alert">{error}</div>}
    {message && <div className="success-notice branch-access-message" role="status">{message}</div>}
    {!branchId
      ? <div className="empty-state branch-access-empty"><KeyRound /><h3>{branches.length ? 'Select a branch' : 'No branches available'}</h3><p>{branches.length ? 'Choose a branch to manage its staff access.' : 'Register a branch before assigning staff access.'}</p></div>
      : busy && !rows.length
        ? <div className="empty-state branch-access-empty"><RefreshCw /><h3>Loading branch access</h3><p>Please wait while staff permissions load.</p></div>
        : !rows.length
          ? <div className="empty-state branch-access-empty"><KeyRound /><h3>No branch staff access</h3><p>Assign a verified tenant user to this branch.</p></div>
          : <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.user?.name || `User ${row.tenant_user_id}`}</b><small>{row.user?.email || 'Tenant user'}</small></td><td>{row.access_role}</td><td>{row.status}</td><td><button className="danger" onClick={() => revoke(row)} disabled={busy}><UserMinus size={14} />Revoke</button></td></tr>)}</tbody></table></div>}
  </section>
}
