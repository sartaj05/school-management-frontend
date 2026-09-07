import { Building2, Edit3, Eye, Power, PowerOff, Save, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi, schoolLogoUrl } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function SchoolDirectory({ rows, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(item, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.school(item.id)
      setSelected(result.school); setEditing(edit)
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const values = { schoolName: selected.schoolName, adminEmail: selected.adminEmail, planSetup: selected.planSetup }
      const result = await schoolApi.updateSchool(selected.id, values)
      setSelected(result.school); setEditing(false); setMessage(result.message); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function toggle(item) {
    const next = item.status === 'active' ? 'inactive' : 'active'
    const warning = next === 'inactive' ? ' Users will not be able to log in and active refresh sessions will be revoked.' : ''
    if (!await confirmPopup({ title: `${next === 'active' ? 'Activate' : 'Deactivate'} ${item.schoolName}?`, message: warning.trim() || 'Users will be able to sign in again.', confirmLabel: next === 'active' ? 'Activate school' : 'Deactivate school', tone: next === 'active' ? 'primary' : 'danger' })) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.updateSchoolStatus(item.id, next)
      setMessage(result.message); if (selected?.id === item.id) setSelected(result.school); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <><section className="data-panel school-directory"><div className="panel-title"><div><span>Super Admin control</span><h2>School directory</h2></div><b>{rows.length} schools</b></div>{error && <div className="form-error school-crud-message">{error}</div>}{message && <div className="success-notice school-crud-message">{message}</div>}{rows.length === 0 ? <div className="empty-state"><Building2 /><h3>No schools found</h3><p>Onboard a school to begin the network.</p></div> : <div className="table-wrap"><table><thead><tr><th>School</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><div className="school-cell"><span className="school-logo">{item.logoPath ? <img src={schoolLogoUrl(item.logoPath)} alt="" /> : <Building2 />}</span><div><b>{item.schoolName}</b><small>{item.domain} · {item.adminEmail}</small></div></div></td><td>{item.planSetup || '—'}</td><td><span className={`status-pill ${item.status === 'inactive' ? 'inactive' : ''}`}>{item.status}</span></td><td><div className="student-row-actions"><button onClick={() => open(item)} disabled={busy}><Eye />View</button><button onClick={() => open(item, true)} disabled={busy}><Edit3 />Edit</button><button className={item.status === 'active' ? 'danger' : 'activate'} onClick={() => toggle(item)} disabled={busy}>{item.status === 'active' ? <PowerOff /> : <Power />}{item.status === 'active' ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>}</section>{selected && <section className="data-panel school-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit school' : 'School details'}</span><h2>{selected.schoolName}</h2></div><button className="refresh-button" onClick={() => setSelected(null)}><X />Close</button></div>{editing ? <form className="student-edit-form" onSubmit={save}><div className="field-grid"><label>School name *<input required value={selected.schoolName || ''} onChange={e => setSelected({ ...selected, schoolName: e.target.value })} /></label><label>Administrator email *<input required type="email" value={selected.adminEmail || ''} onChange={e => setSelected({ ...selected, adminEmail: e.target.value })} /></label><label>Plan *<select value={selected.planSetup || 'Standard'} onChange={e => setSelected({ ...selected, planSetup: e.target.value })}><option>Standard</option><option>Premium</option><option>Enterprise</option><option>Trial</option></select></label><label>Login domain<input value={selected.domain || ''} readOnly /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save school'}</button></form> : <dl className="student-details-grid"><div><dt>School name</dt><dd>{selected.schoolName}</dd></div><div><dt>Domain</dt><dd>{selected.domain}</dd></div><div><dt>Schema</dt><dd>{selected.schemaName}</dd></div><div><dt>Administrator</dt><dd>{selected.adminEmail || '—'}</dd></div><div><dt>Plan</dt><dd>{selected.planSetup || '—'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Created</dt><dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</dd></div></dl>}</section>}</>
}
