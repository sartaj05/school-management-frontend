import { BarChart3, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'

const iso = date => date.toISOString().slice(0, 10)
const defaultTo = iso(new Date())
const defaultFrom = iso(new Date(Date.now() - 29 * 86400000))

export default function AttendanceReport({ initialReport }) {
  const [filters, setFilters] = useState({ from_date: defaultFrom, to_date: defaultTo, class_name: 'All', section: 'All' })
  const [report, setReport] = useState(initialReport)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load(page = 1) {
    setBusy(true)
    setError('')
    try {
      const query = new URLSearchParams({ ...filters, page: String(page), per_page: '25' })
      setReport(await schoolApi.attendanceReport(query.toString()))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const field = (name, value) => setFilters(current => ({ ...current, [name]: value }))
  const summary = report?.summary || {}
  const students = report?.student_summary || []
  const history = report?.data || []
  const pagination = report?.pagination || { page: 1, pages: 0 }

  return <>
    <form className="attendance-report-filter" onSubmit={event => { event.preventDefault(); load() }}>
      <label>From date<input required type="date" value={filters.from_date} onChange={e => field('from_date', e.target.value)} /></label>
      <label>To date<input required type="date" value={filters.to_date} onChange={e => field('to_date', e.target.value)} /></label>
      <label>Class<input value={filters.class_name} onChange={e => field('class_name', e.target.value)} placeholder="All" /></label>
      <label>Section<input value={filters.section} onChange={e => field('section', e.target.value)} placeholder="All" /></label>
      <button className="button button-small" disabled={busy}><Search />{busy ? 'Loading…' : 'Run report'}</button>
    </form>
    {error && <div className="form-error report-message">{error}</div>}
    <div className="stat-grid attendance-report-stats">
      {[
        ['Attendance', `${summary.attendance_percentage ?? 0}%`, 'present rate'],
        ['Present', summary.present ?? 0, 'attendance records'],
        ['Absent', summary.absent ?? 0, 'attendance records'],
        ['Students', summary.students ?? 0, `${summary.school_days ?? 0} school days`],
      ].map(([label, value, note]) => <article key={label}><small>{label}</small><b>{value}</b><span>{note}</span></article>)}
    </div>
    <div className="attendance-report-columns">
      <section className="data-panel">
        <div className="panel-title"><div><span>Student totals</span><h2>Attendance percentage</h2></div><b>{students.length} students</b></div>
        {students.length === 0 ? <div className="empty-state"><BarChart3 /><h3>No attendance records</h3><p>Change the report dates or filters.</p></div> : <div className="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead><tbody>{students.map(row => <tr key={row.student_id}><td><b>{row.student_name}</b><small>ID {row.student_id}</small></td><td>{row.class_name} {row.section}</td><td>{row.present}</td><td>{row.absent}</td><td><b>{row.attendance_percentage ?? 0}%</b></td></tr>)}</tbody></table></div>}
      </section>
      <section className="data-panel">
        <div className="panel-title"><div><span>Daily trend</span><h2>Recorded attendance</h2></div><b>{report?.daily_summary?.length || 0} days</b></div>
        <div className="daily-report-list">{(report?.daily_summary || []).map(day => { const rate = day.total ? Math.round(day.present * 100 / day.total) : 0; return <article key={day.attendance_date}><div><b>{day.attendance_date}</b><small>{day.present} present · {day.absent} absent</small></div><span><i style={{ width: `${rate}%` }} /></span><strong>{rate}%</strong></article> })}</div>
      </section>
    </div>
    <section className="data-panel attendance-history-panel">
      <div className="panel-title"><div><span>Detailed records</span><h2>Attendance history</h2></div><b>{pagination.total || 0} records</b></div>
      {history.length === 0 ? <div className="empty-state"><BarChart3 /><h3>No history found</h3></div> : <div className="table-wrap"><table><thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Status</th><th>Marked by</th><th>Remarks</th></tr></thead><tbody>{history.map(row => <tr key={row.id}><td>{row.attendance_date}</td><td><b>{row.student_name}</b><small>ID {row.student_id}</small></td><td>{row.class_name} {row.section}</td><td><span className={`status-pill ${String(row.status).toLowerCase() === 'absent' ? 'inactive' : ''}`}>{row.status}</span></td><td>{row.marked_by_name || '—'}</td><td>{row.remarks || '—'}</td></tr>)}</tbody></table></div>}
      {pagination.pages > 1 && <div className="report-pagination"><button disabled={busy || pagination.page <= 1} onClick={() => load(pagination.page - 1)}><ChevronLeft />Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button disabled={busy || pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next<ChevronRight /></button></div>}
    </section>
  </>
}
