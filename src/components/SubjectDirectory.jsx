import { BookOpen, Edit3, Eye, Plus, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'

const empty = { code: '', name: '', description: '' }

export default function SubjectDirectory({ rows, canManage, reload }) {
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(item, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.subject(item.id)
      setSelected(result.subject); setMode(edit && canManage && result.subject.status === 'active' ? 'edit' : 'view')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = mode === 'create' ? await schoolApi.createSubject(selected) : await schoolApi.updateSubject(selected.id, selected)
      setSelected(result.subject); setMode('view'); setMessage(result.message); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function archive(item) {
    if (!window.confirm(`Archive ${item.name}? Existing academic history will be preserved.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.deleteSubject(item.id)
      setMessage(result.message); if (selected?.id === item.id) { setSelected(null); setMode('') } await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const field = (name, value) => setSelected({ ...selected, [name]: value })
  return <><div className="page-actions"><p>Manage the subjects taught across your school.</p>{canManage && <button className="button button-small" onClick={() => { setSelected(empty); setMode('create'); setError(''); setMessage('') }}><Plus />Add subject</button>}</div><section className="data-panel subject-directory"><div className="panel-title"><div><span>Academic curriculum</span><h2>Subject directory</h2></div><b>{rows.length} subjects</b></div>{error && <div className="form-error subject-message">{error}</div>}{message && <div className="success-notice subject-message">{message}</div>}{rows.length === 0 ? <div className="empty-state"><BookOpen /><h3>No subjects found</h3><p>Add the first curriculum subject.</p></div> : <div className="table-wrap"><table><thead><tr><th>Code</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><b>{item.code}</b></td><td><b>{item.name}</b><small>{item.description || 'No description'}</small></td><td><span className={`status-pill ${item.status === 'inactive' ? 'inactive' : ''}`}>{item.status}</span></td><td><div className="student-row-actions"><button onClick={() => open(item)} disabled={busy}><Eye />View</button>{canManage && item.status === 'active' && <button onClick={() => open(item, true)} disabled={busy}><Edit3 />Edit</button>}{canManage && item.status === 'active' && <button className="danger" onClick={() => archive(item)} disabled={busy}><Trash2 />Archive</button>}</div></td></tr>)}</tbody></table></div>}</section>{selected && <section className="data-panel subject-detail-card"><div className="panel-title"><div><span>{mode === 'create' ? 'New subject' : mode === 'edit' ? 'Edit subject' : 'Subject details'}</span><h2>{selected.name || 'Create subject'}</h2></div><button className="refresh-button" onClick={() => { setSelected(null); setMode('') }}><X />Close</button></div>{mode === 'view' ? <dl className="student-details-grid"><div><dt>Subject code</dt><dd>{selected.code}</dd></div><div><dt>Name</dt><dd>{selected.name}</dd></div><div><dt>Description</dt><dd>{selected.description || '—'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Created</dt><dd>{formatDate(selected.created_at)}</dd></div><div><dt>Updated</dt><dd>{formatDate(selected.updated_at)}</dd></div></dl> : <form className="student-edit-form" onSubmit={save}><div className="field-grid"><label>Subject code *<input required maxLength="30" value={selected.code || ''} onChange={e => field('code', e.target.value.toUpperCase())} placeholder="MATH" /></label><label>Subject name *<input required maxLength="120" value={selected.name || ''} onChange={e => field('name', e.target.value)} placeholder="Mathematics" /></label><label className="wide">Description<textarea rows="3" value={selected.description || ''} onChange={e => field('description', e.target.value)} /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : mode === 'create' ? 'Create subject' : 'Save subject'}</button></form>}</section>}</>
}

function formatDate(value) { return value ? new Date(value).toLocaleString() : '—' }
