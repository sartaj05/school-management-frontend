import { Edit3, Eye, GraduationCap, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'

const fields = ['full_name', 'email', 'phone', 'gender', 'address', 'employment_type', 'joining_date', 'department', 'role', 'section']

export default function TeacherDirectory({ rows, canManage, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(teacher, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.teacher(teacher.id)
      setSelected(result.teacher); setEditing(edit && canManage && result.teacher.status === 'active')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const values = Object.fromEntries(fields.map(field => [field, selected[field] || '']))
      const result = await schoolApi.updateTeacher(selected.id, values)
      setSelected(result.teacher); setEditing(false); setMessage(result.message); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function archive(teacher) {
    if (!window.confirm(`Archive ${teacher.full_name}? Professional history will be preserved.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.deleteTeacher(teacher.id)
      setMessage(result.message); if (selected?.id === teacher.id) setSelected(null); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const field = (name, value) => setSelected({ ...selected, [name]: value })
  return <><section className="data-panel teacher-directory"><div className="panel-title"><div><span>Professional staff records</span><h2>Teacher directory</h2></div><b>{rows.length} records</b></div>{error && <div className="form-error teacher-crud-message">{error}</div>}{message && <div className="success-notice teacher-crud-message">{message}</div>}{rows.length === 0 ? <div className="empty-state"><GraduationCap /><h3>No teachers found</h3><p>Onboard a teacher to begin the directory.</p></div> : <div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(teacher => <tr key={teacher.id}><td><b>{teacher.full_name}</b><small>{teacher.teacher_id} · {teacher.email}</small></td><td>{teacher.department || '—'} · {teacher.role || 'Teacher'}</td><td><span className={`status-pill ${teacher.status === 'inactive' ? 'inactive' : ''}`}>{teacher.status}</span></td><td><div className="student-row-actions"><button onClick={() => open(teacher)} disabled={busy}><Eye />View</button>{canManage && teacher.status === 'active' && <button onClick={() => open(teacher, true)} disabled={busy}><Edit3 />Edit</button>}{canManage && teacher.status === 'active' && <button className="danger" onClick={() => archive(teacher)} disabled={busy}><Trash2 />Archive</button>}</div></td></tr>)}</tbody></table></div>}</section>{selected && <section className="data-panel teacher-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit teacher' : 'Teacher details'}</span><h2>{selected.full_name}</h2></div><button className="refresh-button" onClick={() => setSelected(null)}><X />Close</button></div>{editing ? <TeacherEditForm teacher={selected} field={field} save={save} busy={busy} error={error} /> : <TeacherDetails teacher={selected} />}</section>}</>
}

function TeacherDetails({ teacher }) {
  const values = [['Teacher ID', teacher.teacher_id], ['Email', teacher.email], ['Phone', teacher.phone], ['Gender', teacher.gender], ['Employment', teacher.employment_type], ['Joining date', teacher.joining_date], ['Department', teacher.department], ['Designation', teacher.role], ['Section', teacher.section], ['Address', teacher.address], ['Status', teacher.status], ['Created', teacher.created_at ? new Date(teacher.created_at).toLocaleString() : null]]
  return <dl className="student-details-grid">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
}

function TeacherEditForm({ teacher, field, save, busy, error }) {
  return <form className="student-edit-form" onSubmit={save}><div className="field-grid three"><label>Full name *<input required value={teacher.full_name || ''} onChange={e => field('full_name', e.target.value)} /></label><label>Email *<input required type="email" value={teacher.email || ''} onChange={e => field('email', e.target.value)} /></label><label>Phone<input value={teacher.phone || ''} onChange={e => field('phone', e.target.value)} /></label><label>Gender<select value={teacher.gender || ''} onChange={e => field('gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Employment<select value={teacher.employment_type || ''} onChange={e => field('employment_type', e.target.value)}><option value="">Select</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Visiting</option></select></label><label>Joining date<input type="date" value={teacher.joining_date || ''} onChange={e => field('joining_date', e.target.value)} /></label><label>Department<input value={teacher.department || ''} onChange={e => field('department', e.target.value)} /></label><label>Designation<input value={teacher.role || ''} onChange={e => field('role', e.target.value)} /></label><label>Section<input value={teacher.section || ''} onChange={e => field('section', e.target.value)} /></label><label className="wide">Address<textarea rows="3" value={teacher.address || ''} onChange={e => field('address', e.target.value)} /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save teacher'}</button></form>
}
