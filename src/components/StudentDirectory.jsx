import { ChevronLeft, ChevronRight, Edit3, Eye, RotateCcw, Save, Search, Trash2, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'
import { isValidIndiaMobile, normalizeIndiaMobile } from '../lib/indiaMobile'
import { useFilterReset } from './FilterResetContext'

const editableFields = ['admission_no', 'first_name', 'last_name', 'gender', 'dob', 'mobile', 'email', 'father_name', 'mother_name', 'class_name', 'section', 'address']

export default function StudentDirectory({ rows = [], canDelete, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [classes, setClasses] = useState([])
  const [directoryRows, setDirectoryRows] = useState(rows)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [className, setClassName] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: rows.length, pages: Math.max(1, Math.ceil(rows.length / 10)) })
  const [directoryBusy, setDirectoryBusy] = useState(false)
  const requestId = useRef(0)
  const observedRows = useRef(rows)

  useEffect(() => {
    let cancelled = false
    schoolApi.classes({ status: 'active', per_page: 200 })
      .then(result => { if (!cancelled) setClasses(result.data || []) })
      .catch(() => { if (!cancelled) setClasses([]) })
    return () => { cancelled = true }
  }, [])

  const loadDirectory = useCallback(async (nextPage = 1) => {
    const currentRequest = ++requestId.current
    setDirectoryBusy(true)
    try {
      const result = await schoolApi.studentDirectoryPage({ search, status, class_name: className, page: nextPage, per_page: 10 })
      if (currentRequest !== requestId.current) return
      const nextRows = result.students || []
      const nextPagination = result.pagination || { page: nextPage, per_page: 10, total: nextRows.length, pages: 1 }
      setDirectoryRows(nextRows)
      setPagination(nextPagination)
      setPage(nextPagination.page || nextPage)
      setError('')
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(requestError.message)
    } finally {
      if (currentRequest === requestId.current) setDirectoryBusy(false)
    }
  }, [search, status, className])

  useEffect(() => {
    const timer = setTimeout(() => loadDirectory(1), 180)
    return () => clearTimeout(timer)
  }, [loadDirectory])

  useEffect(() => {
    if (observedRows.current === rows) return
    observedRows.current = rows
    loadDirectory(1)
  }, [rows, loadDirectory])

  function clearFilters() {
    setSearch('')
    setStatus('')
    setClassName('')
    setPage(1)
  }
  const activeFilterCount = Number(Boolean(search.trim())) + Number(Boolean(status)) + Number(Boolean(className))
  useFilterReset(clearFilters, activeFilterCount)

  async function open(student, edit = false) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.student(student.id)
      setSelected(result.student); setEditing(canDelete && edit && result.student.status === 'active')
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault()
    if (selected.mobile && !isValidIndiaMobile(selected.mobile)) {
      setError('Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.')
      return
    }
    setBusy(true); setError(''); setMessage('')
    try {
      const values = Object.fromEntries(editableFields.map(field => [field, selected[field] || '']))
      const result = await schoolApi.updateStudent(selected.id, values)
      setSelected(result.student); setEditing(false); setMessage(result.message)
      await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function archive(student) {
    if (!await confirmPopup({ title: 'Archive ' + student.first_name + ' ' + (student.last_name || '') + '?', message: 'Attendance history will be preserved.', confirmLabel: 'Archive student' })) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.deleteStudent(student.id)
      setMessage(result.message)
      if (selected?.id === student.id) setSelected(null)
      await reload()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const field = (name, value) => setSelected({ ...selected, [name]: value })
  const pageCount = Math.max(1, pagination.pages || 1)
  const first = pagination.total ? (page - 1) * 10 + 1 : 0
  const last = Math.min(page * 10, pagination.total)

  return <>
    <section className="data-panel student-directory">
      <div className="panel-title"><div><span>Complete student records</span><h2>Student directory</h2></div><b>{pagination.total} records</b></div>
      <div className="directory-filter-toolbar">
        <label className="directory-search"><Search size={17}/><input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Search students, admission no. or class" aria-label="Search students"/></label>
        <label>Status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label>Class<select value={className} onChange={event => { setClassName(event.target.value); setPage(1) }}><option value="">All classes</option>{[...new Set(classes.map(item => item.class_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        {activeFilterCount > 0 && <button type="button" className="directory-clear" onClick={clearFilters}><RotateCcw size={15}/>Clear filters</button>}
      </div>
      {error && <div className="form-error student-crud-message">{error}</div>}
      {message && <div className="success-notice student-crud-message">{message}</div>}
      {directoryBusy && directoryRows.length === 0
        ? <div className="empty-state directory-loading" role="status"><UserRound/><h3>Loading students…</h3></div>
        : directoryRows.length === 0
          ? <div className="empty-state"><UserRound/><h3>{activeFilterCount ? 'No matching students' : 'No students found'}</h3><p>{activeFilterCount ? 'Clear or adjust the filters to find students.' : 'Create a student to begin the directory.'}</p></div>
          : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Actions</th></tr></thead><tbody>{directoryRows.map(student => <tr key={student.id}><td><b>{student.first_name} {student.last_name || ''}</b><small>{student.admission_no} · Roll {student.roll_no || '—'}</small></td><td>{student.class_name} · {student.section}</td><td><span className={'status-pill ' + (student.status === 'inactive' ? 'inactive' : '')}>{student.status}</span></td><td><div className="student-row-actions"><button onClick={() => open(student)} disabled={busy}><Eye/>View</button>{canDelete && student.status === 'active' && <button onClick={() => open(student, true)} disabled={busy}><Edit3/>Edit</button>}{canDelete && student.status === 'active' && <button className="danger" onClick={() => archive(student)} disabled={busy}><Trash2/>Archive</button>}</div></td></tr>)}</tbody></table></div>}
      <div className="directory-pagination"><span>Showing {first}–{last} of {pagination.total} students</span><div><button type="button" onClick={() => loadDirectory(1)} disabled={directoryBusy || page <= 1} aria-label="First page"><ChevronLeft/><ChevronLeft/></button><button type="button" onClick={() => loadDirectory(page - 1)} disabled={directoryBusy || page <= 1} aria-label="Previous page"><ChevronLeft/></button><span>Page {page} of {pageCount}</span><button type="button" onClick={() => loadDirectory(page + 1)} disabled={directoryBusy || page >= pageCount} aria-label="Next page"><ChevronRight/></button><button type="button" onClick={() => loadDirectory(pageCount)} disabled={directoryBusy || page >= pageCount} aria-label="Last page"><ChevronRight/><ChevronRight/></button></div></div>
    </section>
    {selected && <section className="data-panel student-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit student' : 'Student details'}</span><h2>{selected.first_name} {selected.last_name || ''}</h2></div><button className="refresh-button" onClick={() => setSelected(null)}><X/>Close</button></div>{editing ? <StudentEditForm student={selected} students={directoryRows} classes={classes} field={field} save={save} busy={busy} error={error}/> : <StudentDetails student={selected}/>}</section>}
  </>
}
function StudentDetails({ student }) {
  const values = [['Admission number', student.admission_no], ['Roll number', student.roll_no], ['Class', `${student.class_name} · ${student.section}`], ['Gender', student.gender], ['Date of birth', student.dob], ['Mobile', student.mobile], ['Email', student.email], ['Father', student.father_name], ['Mother', student.mother_name], ['Address', student.address], ['Status', student.status], ['Created', student.created_at ? new Date(student.created_at).toLocaleString() : null]]
  return <dl className="student-details-grid">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>
}

function StudentEditForm({ student, students, classes, field, save, busy, error }) {
  const commonSections = ['A', 'B', 'C', 'D', 'E', 'F']
  const sections = [...new Set([
    ...commonSections,
    ...students.filter(item => item.class_name === student.class_name).map(item => (item.section || '').trim()).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  const invalidMobile = Boolean(student.mobile && !isValidIndiaMobile(student.mobile))
  return <form className="student-edit-form" onSubmit={save}>
    <div className="field-grid three">
      <label>Admission number *<input required value={student.admission_no || ''} onChange={e => field('admission_no', e.target.value)} /></label>
      <label>First name *<input required value={student.first_name || ''} onChange={e => field('first_name', e.target.value)} /></label>
      <label>Last name<input value={student.last_name || ''} onChange={e => field('last_name', e.target.value)} /></label>
      <label>Class *<select required value={student.class_name || ''} onChange={e => { field('class_name', e.target.value); field('section', '') }}><option value="">Select class</option>{classes.map(item => <option key={item.id} value={item.class_name}>{item.class_name}</option>)}{student.class_name && !classes.some(item => item.class_name === student.class_name) && <option value={student.class_name}>{student.class_name}</option>}</select></label>
      <label>Section *<select required value={student.section || ''} disabled={!student.class_name} onChange={e => field('section', e.target.value)}><option value="">Select section</option>{sections.map(section => <option key={section} value={section}>{section}</option>)}</select></label>
      <label>Gender<select value={student.gender || ''} onChange={e => field('gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
      <label>Date of birth<input type="date" value={student.dob || ''} onChange={e => field('dob', e.target.value)} /></label>
      <label>Mobile<input type="tel" inputMode="tel" maxLength="13" pattern="[+]91[6-9][0-9]{9}" title="Optional. If entered, use 10 digits starting with 6, 7, 8, or 9." value={student.mobile || ''} onChange={e => field('mobile', normalizeIndiaMobile(e.target.value))} /></label>
      <label>Email<input type="email" value={student.email || ''} onChange={e => field('email', e.target.value)} /></label>
      <label>Father name<input value={student.father_name || ''} onChange={e => field('father_name', e.target.value)} /></label>
      <label>Mother name<input value={student.mother_name || ''} onChange={e => field('mother_name', e.target.value)} /></label>
      <label className="wide">Address<textarea rows="3" value={student.address || ''} onChange={e => field('address', e.target.value)} /></label>
    </div>
    {invalidMobile && <div className="form-error">Enter a valid Indian mobile number: 10 digits starting with 6, 7, 8, or 9.</div>}
    {error && <div className="form-error">{error}</div>}
    <button className="button button-small" disabled={busy || invalidMobile}><Save />{busy ? 'Saving…' : 'Save student'}</button>
  </form>
}
