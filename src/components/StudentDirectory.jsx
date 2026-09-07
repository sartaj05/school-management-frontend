import { Edit3, Eye, Save, Trash2, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const editableFields = ['admission_no', 'first_name', 'last_name', 'gender', 'dob', 'mobile', 'email', 'father_name', 'mother_name', 'class_name', 'section', 'address']

export default function StudentDirectory({ rows, canDelete, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(student, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.student(student.id)
      setSelected(result.student); setEditing(edit && result.student.status === 'active')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const values = Object.fromEntries(editableFields.map(field => [field, selected[field] || '']))
      const result = await schoolApi.updateStudent(selected.id, values)
      setSelected(result.student); setEditing(false); setMessage(result.message); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function archive(student) {
    if (!await confirmPopup({ title: `Archive ${student.first_name} ${student.last_name || ''}?`, message: 'Attendance history will be preserved.', confirmLabel: 'Archive student' })) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.deleteStudent(student.id)
      setMessage(result.message); if (selected?.id === student.id) setSelected(null); await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const field = (name, value) => setSelected({ ...selected, [name]: value })
  return <><section className="data-panel student-directory"><div className="panel-title"><div><span>Complete student records</span><h2>Student directory</h2></div><b>{rows.length} records</b></div>{error && <div className="form-error student-crud-message">{error}</div>}{message && <div className="success-notice student-crud-message">{message}</div>}{rows.length === 0 ? <div className="empty-state"><UserRound /><h3>No students found</h3><p>Create a student to begin the directory.</p></div> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(student => <tr key={student.id}><td><b>{student.first_name} {student.last_name || ''}</b><small>{student.admission_no} · Roll {student.roll_no || '—'}</small></td><td>{student.class_name} · {student.section}</td><td><span className={`status-pill ${student.status === 'inactive' ? 'inactive' : ''}`}>{student.status}</span></td><td><div className="student-row-actions"><button onClick={() => open(student)} disabled={busy}><Eye />View</button>{student.status === 'active' && <button onClick={() => open(student, true)} disabled={busy}><Edit3 />Edit</button>}{canDelete && student.status === 'active' && <button className="danger" onClick={() => archive(student)} disabled={busy}><Trash2 />Archive</button>}</div></td></tr>)}</tbody></table></div>}</section>{selected && <section className="data-panel student-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit student' : 'Student details'}</span><h2>{selected.first_name} {selected.last_name || ''}</h2></div><button className="refresh-button" onClick={() => setSelected(null)}><X />Close</button></div>{editing ? <StudentEditForm student={selected} field={field} save={save} busy={busy} error={error} /> : <StudentDetails student={selected} />}</section>}</>
}

function StudentDetails({ student }) {
  const values = [['Admission number', student.admission_no], ['Roll number', student.roll_no], ['Class', `${student.class_name} · ${student.section}`], ['Gender', student.gender], ['Date of birth', student.dob], ['Mobile', student.mobile], ['Email', student.email], ['Father', student.father_name], ['Mother', student.mother_name], ['Address', student.address], ['Status', student.status], ['Created', student.created_at ? new Date(student.created_at).toLocaleString() : null]]
  return <dl className="student-details-grid">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
}

function StudentEditForm({ student, field, save, busy, error }) {
  return <form className="student-edit-form" onSubmit={save}><div className="field-grid three"><label>Admission number *<input required value={student.admission_no || ''} onChange={e => field('admission_no', e.target.value)} /></label><label>First name *<input required value={student.first_name || ''} onChange={e => field('first_name', e.target.value)} /></label><label>Last name<input value={student.last_name || ''} onChange={e => field('last_name', e.target.value)} /></label><label>Class *<input required value={student.class_name || ''} onChange={e => field('class_name', e.target.value)} /></label><label>Section *<input required value={student.section || ''} onChange={e => field('section', e.target.value)} /></label><label>Gender<select value={student.gender || ''} onChange={e => field('gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label><label>Date of birth<input type="date" value={student.dob || ''} onChange={e => field('dob', e.target.value)} /></label><label>Mobile<input value={student.mobile || ''} onChange={e => field('mobile', e.target.value)} /></label><label>Email<input type="email" value={student.email || ''} onChange={e => field('email', e.target.value)} /></label><label>Father name<input value={student.father_name || ''} onChange={e => field('father_name', e.target.value)} /></label><label>Mother name<input value={student.mother_name || ''} onChange={e => field('mother_name', e.target.value)} /></label><label className="wide">Address<textarea rows="3" value={student.address || ''} onChange={e => field('address', e.target.value)} /></label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save student'}</button></form>
}
