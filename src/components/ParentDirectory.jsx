import { Edit3, Eye, HeartHandshake, KeyRound, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'
import ParentRelationshipManager from './ParentRelationshipManager'
import { confirmPopup } from '../lib/confirmPopup'

export default function ParentDirectory({ rows, canDelete, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [portalLoginOpen, setPortalLoginOpen] = useState(false)
  const [portalStudents, setPortalStudents] = useState([])
  const [portalForm, setPortalForm] = useState({ name: '', student_id: '', relationship_type: 'guardian', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function open(parent, edit = false) {
    setBusy(true); setError(''); setMessage(''); setPortalLoginOpen(false)
    try {
      const result = await schoolApi.parent(parent.id)
      setSelected({ ...result.parent, _canManage: canDelete })
      setEditing(canDelete && edit && result.parent.status === 'active')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function openPortalLogin(parent) {
    setBusy(true); setError(''); setMessage('')
    try {
      const [parentResult, studentResult] = await Promise.all([
        schoolApi.parent(parent.id),
        schoolApi.students({ per_page: 200 }),
      ])
      const candidates = [studentResult.students, studentResult.data?.students, studentResult.data, studentResult.items]
      const students = candidates.find(Array.isArray) || []
      setSelected({ ...parentResult.parent, _canManage: canDelete })
      setEditing(false)
      setPortalStudents(students.filter(student => String(student.status || '').toLowerCase() === 'active' || student.is_active === true || student.is_active === 1))
      setPortalForm({
        name: parentResult.parent.father_name || parentResult.parent.mother_name || '',
        student_id: '',
        relationship_type: 'guardian',
        password: '',
      })
      setPortalLoginOpen(true)
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

  async function createPortalLogin(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const values = {
        name: portalForm.name.trim(),
        student_id: Number(portalForm.student_id),
        relationship_type: portalForm.relationship_type,
      }
      if (selected.portal_login_status !== 'available') values.password = portalForm.password
      const result = await schoolApi.createParentPortalAccount(selected.id, values)
      setSelected(current => ({ ...current, portal_login_status: 'linked' }))
      setPortalLoginOpen(false); setMessage(result.message); await reload()
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

  const field = (name, value) => setSelected(current => ({ ...current, [name]: value }))
  return <>
    <section className="data-panel parent-directory">
      <div className="panel-title"><div><span>Family contacts</span><h2>Parent directory</h2></div><b>{rows.length} records</b></div>
      {error && <div className="form-error parent-crud-message">{error}</div>}
      {message && <div className="success-notice parent-crud-message">{message}</div>}
      {rows.length === 0 ? <div className="empty-state"><HeartHandshake /><h3>No parents found</h3><p>Register a parent to begin the directory.</p></div> : <div className="table-wrap"><table><thead><tr><th>Parent / guardian</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(parent => {
        const loginStatus = parent.portal_login_status || 'missing'
        const loginLabel = loginStatus === 'linked' ? 'Login connected' : loginStatus === 'available' ? 'Existing Parent login' : loginStatus === 'inactive' ? 'Parent login inactive' : loginStatus === 'conflict' ? 'Email used by another role' : 'No login yet'
        return <tr key={parent.id}>
          <td><b>{parent.father_name || '—'}</b><small>{parent.mother_name ? `Mother: ${parent.mother_name}` : 'No mother name'}</small></td>
          <td>{parent.mobile}<small>{parent.email || 'No email'}</small></td>
          <td><span className={`status-pill ${parent.status === 'inactive' ? 'inactive' : ''}`}>{parent.status || 'active'}</span><small>{loginLabel}</small></td>
          <td><div className="student-row-actions">
            <button onClick={() => open(parent)} disabled={busy}><Eye />View</button>
            {canDelete && parent.status !== 'inactive' && <button onClick={() => open(parent, true)} disabled={busy}><Edit3 />Edit</button>}
            {canDelete && parent.status !== 'inactive' && parent.email && ['missing', 'available'].includes(loginStatus) && <button onClick={() => openPortalLogin(parent)} disabled={busy}><KeyRound />{loginStatus === 'available' ? 'Link login' : 'Create login'}</button>}
            {canDelete && parent.status !== 'inactive' && <button className="danger" onClick={() => archive(parent)} disabled={busy}><Trash2 />Archive</button>}
          </div></td>
        </tr>
      })}</tbody></table></div>}
    </section>
    {selected && <section className="data-panel parent-detail-card">
      <div className="panel-title"><div><span>{editing ? 'Edit parent' : 'Parent details'}</span><h2>{selected.father_name || selected.mother_name || 'Parent profile'}</h2></div><button className="refresh-button" onClick={() => { setSelected(null); setPortalLoginOpen(false) }}><X />Close</button></div>
      {editing ? <ParentEditForm parent={selected} field={field} save={save} busy={busy} error={error} /> : <ParentDetails parent={selected} />}
      {portalLoginOpen && <ParentPortalLoginForm parent={selected} students={portalStudents} values={portalForm} setValues={setPortalForm} onSubmit={createPortalLogin} onCancel={() => setPortalLoginOpen(false)} busy={busy} error={error} />}
    </section>}
  </>
}

function ParentPortalLoginForm({ parent, students, values, setValues, onSubmit, onCancel, busy, error }) {
  const existingLogin = parent.portal_login_status === 'available'
  const field = (name, value) => setValues(current => ({ ...current, [name]: value }))
  return <form className="editor-card parent-portal-login" onSubmit={onSubmit}>
    <div className="editor-heading"><KeyRound /><div><h3>{existingLogin ? 'Link existing Parent login' : 'Create Parent login'}</h3><p>The login will use this saved contact email and connect to the selected student.</p></div></div>
    {existingLogin && <div className="field-help">An active Parent account already uses {parent.email}. Its current password will stay unchanged.</div>}
    <div className="field-grid three">
      <label>Parent login name *<input required value={values.name} onChange={event => field('name', event.target.value)} /></label>
      <label>Login email<input readOnly value={parent.email || ''} /></label>
      <label>Student *<select required value={values.student_id} onChange={event => field('student_id', event.target.value)}><option value="">{students.length ? 'Select a student' : 'No active students found'}</option>{students.map(student => <option key={student.id} value={student.id}>{student.first_name} {student.last_name || ''} · {student.admission_no} · {student.class_name || 'No class'} {student.section || ''}</option>)}</select></label>
      <label>Relationship to student *<select value={values.relationship_type} onChange={event => field('relationship_type', event.target.value)}><option value="guardian">Guardian</option><option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option></select></label>
      {!existingLogin && <label>Temporary password *<input type="password" required minLength="8" autoComplete="new-password" value={values.password} onChange={event => field('password', event.target.value)} placeholder="At least 8 characters" /></label>}
    </div>
    {!existingLogin && <p className="field-help">The Parent will be asked to change this password after the first sign-in.</p>}
    {!students.length && <div className="field-help">Create an active student first, then link this Parent account.</div>}
    {error && <div className="form-error">{error}</div>}
    <div className="student-row-actions"><button className="button button-small" disabled={busy || !students.length}><Save />{busy ? 'Saving…' : existingLogin ? 'Link Parent login' : 'Create Parent login'}</button><button type="button" onClick={onCancel}>Cancel</button></div>
  </form>
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
