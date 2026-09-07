import { Edit3, Link2, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const empty = { teacher_id: '', class_id: '', subject_id: '', academic_year: '' }

function currentAcademicYear() {
  const now = new Date()
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${start + 1}`
}

export default function TeacherClassAssignmentDirectory({ rows, canManage, reload }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...empty, academic_year: currentAcademicYear() })
  const [options, setOptions] = useState({ teachers: [], classes: [], subjects: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!editing) return
    Promise.all([schoolApi.teachers(), schoolApi.classes(), schoolApi.subjects()])
      .then(([teachers, classes, subjects]) => setOptions({
        teachers: (teachers.data || []).filter(item => item.status === 'active'),
        classes: (classes.data || []).filter(item => item.status === 'active'),
        subjects: (subjects.data || []).filter(item => item.status === 'active'),
      }))
      .catch(err => setError(err.message))
  }, [editing])

  function open(item = null) {
    setError('')
    setMessage('')
    setEditing(item?.id || 'new')
    setForm(item ? {
      teacher_id: String(item.teacher_id),
      class_id: String(item.class_id),
      subject_id: String(item.subject_id),
      academic_year: item.academic_year,
    } : { ...empty, academic_year: currentAcademicYear() })
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const values = {
      teacher_id: Number(form.teacher_id),
      class_id: Number(form.class_id),
      subject_id: Number(form.subject_id),
      academic_year: form.academic_year.trim(),
    }
    try {
      const result = editing === 'new'
        ? await schoolApi.createTeacherClassAssignment(values)
        : await schoolApi.updateTeacherClassAssignment(editing, values)
      setMessage(result.message)
      setEditing(null)
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function archive(item) {
    if (!await confirmPopup({ title: `Archive ${item.teacher_name}'s assignment?`, message: `${item.class_name} · ${item.subject_name} will become inactive.`, confirmLabel: 'Archive assignment' })) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await schoolApi.deleteTeacherClassAssignment(item.id)
      setMessage(result.message)
      await reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

  return <>
    <div className="page-actions">
      <p>Connect active teachers with the classes and subjects they teach.</p>
      {canManage && <button className="button button-small" onClick={() => editing ? setEditing(null) : open()}>
        {editing ? <X /> : <Plus />}{editing ? 'Close form' : 'Add assignment'}
      </button>}
    </div>
    {error && <div className="form-error assignment-message">{error}</div>}
    {message && <div className="success-notice assignment-message">{message}</div>}
    {editing && <form className="editor-card" onSubmit={save}>
      <div className="editor-heading"><Link2 /><div><h3>{editing === 'new' ? 'Create teacher assignment' : 'Edit teacher assignment'}</h3><p>Only active tenant records can be assigned.</p></div></div>
      <div className="field-grid three">
        <label>Teacher *<select required value={form.teacher_id} onChange={e => field('teacher_id', e.target.value)}><option value="">Select teacher</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.teacher_id} - {item.full_name}</option>)}</select></label>
        <label>Class *<select required value={form.class_id} onChange={e => field('class_id', e.target.value)}><option value="">Select class</option>{options.classes.map(item => <option key={item.id} value={item.id}>{item.class_name}{item.section ? ` - ${item.section}` : ''}</option>)}</select></label>
        <label>Subject *<select required value={form.subject_id} onChange={e => field('subject_id', e.target.value)}><option value="">Select subject</option>{options.subjects.map(item => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}</select></label>
        <label>Academic year *<input required maxLength="20" value={form.academic_year} onChange={e => field('academic_year', e.target.value)} placeholder="2026-2027" /></label>
      </div>
      <button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save assignment'}</button>
    </form>}
    <section className="data-panel assignment-directory">
      <div className="panel-title"><div><span>Teaching allocation</span><h2>Teacher-Class-Subject assignments</h2></div><b>{rows.length} assignments</b></div>
      {rows.length === 0 ? <div className="empty-state"><Link2 /><h3>No assignments found</h3><p>Add a teacher, class and subject assignment.</p></div> : <div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Class</th><th>Subject</th><th>Academic year</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><b>{item.teacher_name}</b><small>{item.teacher_code}</small></td><td><b>{item.class_name}</b><small>{item.section || 'No section'}</small></td><td><b>{item.subject_name}</b><small>{item.subject_code}</small></td><td>{item.academic_year}</td><td><span className={`status-pill ${item.status === 'inactive' ? 'inactive' : ''}`}>{item.status}</span></td>{canManage && <td><div className="student-row-actions"><button onClick={() => open(item)} disabled={busy}><Edit3 />Edit</button><button className="danger" onClick={() => archive(item)} disabled={busy}><Trash2 />Archive</button></div></td>}</tr>)}</tbody></table></div>}
    </section>
  </>
}
