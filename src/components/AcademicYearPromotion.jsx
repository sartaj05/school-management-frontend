import { Archive, GraduationCap, History, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

export default function AcademicYearPromotion() {
  const [years, setYears] = useState([])
  const [form, setForm] = useState({ from_year: '', to_year: '', promotions: [] })
  const [newYear, setNewYear] = useState({ year_label: '', starts_on: '', ends_on: '' })
  const [enrollmentYear, setEnrollmentYear] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [historyStudentId, setHistoryStudentId] = useState('')
  const [historyRows, setHistoryRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const result = await schoolApi.academicYears()
      const nextYears = result.data || []
      setYears(nextYears)
      setEnrollmentYear(current => current && nextYears.some(year => year.year_label === current)
        ? current
        : nextYears.find(year => year.status === 'active')?.year_label || nextYears[0]?.year_label || '')
    } catch (requestError) { setError(requestError.message) }
  }

  async function loadEnrollments(year) {
    if (!year) { setEnrollments([]); return }
    try {
      const result = await schoolApi.academicYearEnrollments(year)
      setEnrollments(result.data || [])
    } catch (requestError) { setError(requestError.message) }
  }

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadEnrollments(enrollmentYear), 0)
    return () => clearTimeout(timer)
  }, [enrollmentYear])

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.promoteStudents(form)
      setMessage(`${result.promoted || 0} student(s) promoted.`)
      await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function createYear(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createAcademicYear(newYear)
      setMessage(`${result.academic_year?.year_label || newYear.year_label} created.`)
      setNewYear({ year_label: '', starts_on: '', ends_on: '' })
      await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function archiveYear(year) {
    if (!window.confirm(`Archive academic year ${year.year_label}? Its history will remain available.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      await schoolApi.archiveAcademicYear(year.year_label)
      setMessage(`${year.year_label} archived.`)
      await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function loadHistory(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await schoolApi.academicStudentHistory(historyStudentId)
      setHistoryRows(result.data || [])
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  return <section className="data-panel academic-year-promotion">
    <div className="panel-title"><div><span>Academic year control</span><h2>Promote students</h2></div><GraduationCap /></div>
    <p className="field-help">Create academic years, promote students, and archive old years without deleting history.</p>
    <form className="field-grid three academic-year-create" onSubmit={createYear}>
      <label>New academic year *<input required value={newYear.year_label} onChange={event => setNewYear({ ...newYear, year_label: event.target.value })} placeholder="2026-2027" /></label>
      <label>Starts on<input type="date" value={newYear.starts_on} onChange={event => setNewYear({ ...newYear, starts_on: event.target.value })} /></label>
      <label>Ends on<input type="date" value={newYear.ends_on} onChange={event => setNewYear({ ...newYear, ends_on: event.target.value })} /></label>
      <button className="button button-small" disabled={busy}><Save size={16} />Create year</button>
    </form>
    {years.length > 0 && <div className="table-wrap academic-year-table"><table><thead><tr><th>Academic year</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead><tbody>{years.map(year => <tr key={year.id}><td><b>{year.year_label}</b></td><td>{year.starts_on || '-'} to {year.ends_on || '-'}</td><td>{year.status}</td><td>{year.status === 'active' && <button className="button button-small secondary" disabled={busy} onClick={() => archiveYear(year)}><Archive size={14} />Archive</button>}</td></tr>)}</tbody></table></div>}
    {years.length > 0 && <section className="academic-history academic-enrollment-roster"><div className="panel-title"><div><span>Current-year roster</span><h3>Student enrollments</h3></div><History /></div><div className="field-grid three"><label>Academic year<select value={enrollmentYear} onChange={event => setEnrollmentYear(event.target.value)}>{years.map(year => <option key={year.id} value={year.year_label}>{year.year_label} · {year.status}</option>)}</select></label><button className="button button-small" type="button" disabled={busy || !enrollmentYear} onClick={() => loadEnrollments(enrollmentYear)}>Refresh roster</button></div>{enrollments.length > 0 ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Admission no.</th><th>Class</th><th>Section</th><th>Status</th></tr></thead><tbody>{enrollments.map(row => <tr key={row.id}><td><b>{row.student_name || '-'}</b></td><td>{row.admission_no || '-'}</td><td>{row.class_name || '-'}</td><td>{row.section || '-'}</td><td>{row.status || '-'}</td></tr>)}</tbody></table></div> : <p className="field-help">No enrollments found for this academic year.</p>}</section>}
    <form className="field-grid" onSubmit={submit}>
      <label>From academic year *<input required value={form.from_year} onChange={event => setForm({ ...form, from_year: event.target.value })} placeholder="2025-2026" /></label>
      <label>To academic year *<input required value={form.to_year} onChange={event => setForm({ ...form, to_year: event.target.value })} placeholder="2026-2027" /></label>
      <label className="wide">Promotion JSON *<textarea required rows="6" value={JSON.stringify(form.promotions, null, 2)} onChange={event => { try { setForm({ ...form, promotions: JSON.parse(event.target.value) }) } catch { /* keep the current valid value */ } }} placeholder={'[{"student_id":1,"next_class_name":"Grade 9","next_section":"A"}'} /></label>
      <div className="wide field-help">Example: [{'{'}"student_id": 1, "next_class_name": "Grade 9", "next_section": "A"{'}'}]</div>
      {error && <div className="form-error wide">{error}</div>}{message && <div className="success-notice wide">{message}</div>}
      <button className="button button-small" disabled={busy}><Save size={16} />{busy ? 'Promoting…' : 'Promote students'}</button>
    </form>
    <div className="field-help">Known academic years: {years.map(year => year.year_label).join(', ') || 'None yet'}</div>
    <section className="academic-history">
      <div className="panel-title"><div><span>Archive-safe history</span><h3>Student enrollment history</h3></div><History /></div>
      <form className="field-grid three" onSubmit={loadHistory}>
        <label>Student id<input required type="number" min="1" value={historyStudentId} onChange={event => setHistoryStudentId(event.target.value)} /></label>
        <button className="button button-small" disabled={busy}>Load history</button>
      </form>
      {historyRows.length > 0 && <div className="table-wrap"><table><thead><tr><th>Academic year</th><th>Class</th><th>Section</th><th>Status</th><th>Promoted</th></tr></thead><tbody>{historyRows.map(row => <tr key={row.id}><td>{row.academic_year}</td><td>{row.class_name}</td><td>{row.section}</td><td>{row.status}</td><td>{row.promoted_at || 'Original enrollment'}</td></tr>)}</tbody></table></div>}
    </section>
  </section>
}
