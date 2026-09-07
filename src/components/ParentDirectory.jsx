import { Edit3, Eye, HeartHandshake, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'
import ParentRelationshipManager from './ParentRelationshipManager'
import { confirmPopup } from '../lib/confirmPopup'

export default function ParentDirectory({ rows, canDelete, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(parent, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.parent(parent.id)
      setSelected({ ...result.parent, _canManage: canDelete }); setEditing(edit && result.parent.status === 'active')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const values = { father_name: selected.father_name || '', mother_name: selected.mother_name || '', mobile: selected.mobile || '', email: selected.email || '', address: selected.address || '' }
      const result = await schoolApi.updateParent(selected.id, values)
      setSelected({ ...result.parent, _canManage: canDelete }); setEditing(false); setMessage(result.message); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function archive(parent) {
    const name = parent.father_name || parent.mother_name || 'this parent'
    if (!await confirmPopup({ title: `Archive ${name}?`, message: 'Contact and relationship history will be preserved.', confirmLabel: 'Archive parent' })) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.deleteParent(parent.id)
      setMessage(result.message); if (selected?.id === parent.id) setSelected(null); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const field = (name, value) => setSelected({ ...selected, [name]: value })
  return <><section className="data-panel parent-directory"><div className="panel-title"><div><span>Family contacts</span><h2>Parent directory</h2></div><b>{rows.length} records</b></div>{error && <div className="form-error parent-crud-message">{error}</div>}{message && <div className="success-notice parent-crud-message">{message}</div>}{rows.length === 0 ? <div className="empty-state"><HeartHandshake /><h3>No parents found</h3><p>Register a parent to begin the directory.</p></div> : <div className="table-wrap"><table><thead><tr><th>Parent / guardian</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(parent => <tr key={parent.id}><td><b>{parent.father_name || '—'}</b><small>{parent.mother_name ? `Mother: ${parent.mother_name}` : 'No mother name'}</small></td><td>{parent.mobile}<small>{parent.email || 'No email'}</small></td><td><span className={`status-pill ${parent.status === 'inactive' ? 'inactive' : ''}`}>{parent.status || 'active'}</span></td><td><div className="student-row-actions"><button onClick={() => open(parent)} disabled={busy}><Eye />View</button>{parent.status !== 'inactive' && <button onClick={() => open(parent, true)} disabled={busy}><Edit3 />Edit</button>}{canDelete && parent.status !== 'inactive' && <button className="danger" onClick={() => archive(parent)} disabled={busy}><Trash2 />Archive</button>}</div></td></tr>)}</tbody></table></div>}</section>{selected && <section className="data-panel parent-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit parent' : 'Parent details'}</span><h2>{selected.father_name || selected.mother_name || 'Parent profile'}</h2></div><button className="refresh-button" onClick={() => setSelected(null)}><X />Close</button></div>{editing ? <ParentEditForm parent={selected} field={field} save={save} busy={busy} error={error} /> : <ParentDetails parent={selected} />}</section>}</>
}

function ParentDetails({ parent }) {
  return <><ParentProfileFields parent={parent} /><ParentRelationshipManager parent={parent} canManage={Boolean(parent._canManage)} /></>
}

function ParentProfileFields({ parent }) {
  const values = [['Father name', parent.father_name], ['Mother name', parent.mother_name], ['Mobile', parent.mobile], ['Email', parent.email], ['Address', parent.address], ['Status', parent.status], ['Created', parent.created_at ? new Date(parent.created_at).toLocaleString() : null]]
  return <dl className="student-details-grid">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
}

function ParentEditForm({ parent, field, save, busy, error }) {
  return <form className="student-edit-form" onSubmit={save}><div className="field-grid"><label>Father name<input value={parent.father_name || ''} onChange={e => field('father_name', e.target.value)} /></label><label>Mother name<input value={parent.mother_name || ''} onChange={e => field('mother_name', e.target.value)} /></label><label>Mobile *<input required value={parent.mobile || ''} onChange={e => field('mobile', e.target.value.replace(/[^0-9+]/g, ''))} /></label><label>Email<input type="email" value={parent.email || ''} onChange={e => field('email', e.target.value)} /></label><label className="wide">Address<textarea rows="3" value={parent.address || ''} onChange={e => field('address', e.target.value)} /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save parent'}</button></form>
}
