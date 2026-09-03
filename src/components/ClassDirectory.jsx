import { BookOpen, Edit3, Eye, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'

export default function ClassDirectory({ rows, canDelete, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(item, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.schoolClass(item.id)
      setSelected(result.class); setEditing(edit && result.class.status === 'active')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.updateClass(selected.id, { class_name: selected.class_name, description: selected.description || '' })
      setSelected(result.class); setEditing(false); setMessage(result.message); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function archive(item) {
    if (!window.confirm(`Archive ${item.class_name}? Student and attendance history will be preserved.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.deleteClass(item.id)
      setMessage(result.message); if (selected?.id === item.id) setSelected(null); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <><section className="data-panel class-directory"><div className="panel-title"><div><span>Academic structure</span><h2>Class directory</h2></div><b>{rows.length} records</b></div>{error && <div className="form-error class-crud-message">{error}</div>}{message && <div className="success-notice class-crud-message">{message}</div>}{rows.length === 0 ? <div className="empty-state"><BookOpen /><h3>No classes found</h3><p>Create a class to begin the academic structure.</p></div> : <div className="table-wrap"><table><thead><tr><th>Class</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><b>{item.class_name}</b><small>Class ID: {item.id}</small></td><td>{item.description || '—'}</td><td><span className={`status-pill ${item.status === 'inactive' ? 'inactive' : ''}`}>{item.status || 'active'}</span></td><td><div className="student-row-actions"><button onClick={() => open(item)} disabled={busy}><Eye />View</button>{item.status !== 'inactive' && <button onClick={() => open(item, true)} disabled={busy}><Edit3 />Edit</button>}{canDelete && item.status !== 'inactive' && <button className="danger" onClick={() => archive(item)} disabled={busy}><Trash2 />Archive</button>}</div></td></tr>)}</tbody></table></div>}</section>{selected && <section className="data-panel class-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit class' : 'Class details'}</span><h2>{selected.class_name}</h2></div><button className="refresh-button" onClick={() => setSelected(null)}><X />Close</button></div>{editing ? <form className="student-edit-form" onSubmit={save}><div className="field-grid"><label>Class name *<input required value={selected.class_name || ''} onChange={e => setSelected({ ...selected, class_name: e.target.value })} /></label><label>Description<textarea rows="3" value={selected.description || ''} onChange={e => setSelected({ ...selected, description: e.target.value })} /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save class'}</button></form> : <dl className="student-details-grid"><div><dt>Class name</dt><dd>{selected.class_name}</dd></div><div><dt>Description</dt><dd>{selected.description || '—'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Created</dt><dd>{formatDate(selected.created_at)}</dd></div><div><dt>Last updated</dt><dd>{formatDate(selected.updated_at)}</dd></div><div><dt>Created by user ID</dt><dd>{selected.created_by || '—'}</dd></div></dl>}</section>}</>
}

function formatDate(value) { return value ? new Date(value).toLocaleString() : '—' }
