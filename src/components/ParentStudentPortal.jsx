import { BookCheck, CalendarCheck, CircleDollarSign, LibraryBig, Award, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const tabs = [
  ['overview', 'Overview', UserRound], ['attendance', 'Attendance', CalendarCheck],
  ['timetable', 'Timetable', CalendarCheck], ['assignments', 'Assignments', BookCheck],
  ['results', 'Results', Award], ['fees', 'Fees', CircleDollarSign], ['library', 'Library', LibraryBig], ['calendar', 'Calendar', CalendarCheck],
]

const date = value => value ? new Date(value).toLocaleDateString() : '—'

export default function ParentStudentPortal() {
  const [me, setMe] = useState(null), [studentId, setStudentId] = useState(''), [tab, setTab] = useState('overview')
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('')

  useEffect(() => {
    schoolApi.portalMe().then(result => {
      setMe(result)
      const initial = result.student?.id || result.children?.[0]?.id || ''
      setStudentId(initial ? String(initial) : '')
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!studentId) return
    const methods = { overview: schoolApi.portalOverview, attendance: schoolApi.portalAttendance, timetable: schoolApi.portalTimetable, assignments: schoolApi.portalAssignments, results: schoolApi.portalResults, fees: schoolApi.portalFees, library: schoolApi.portalLibraryLoans, calendar: schoolApi.calendarEvents }
    setLoading(true); setError(''); setData(null)
    const portalRequest = tab === 'calendar' ? methods[tab]() : methods[tab](studentId)
    portalRequest.then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [tab, studentId])

  if (loading && !me) return <div className="loading-grid"><i/><i/><i/></div>
  if (error && !me) return <section className="empty-state"><UserRound/><h3>Portal access is not ready</h3><p>{error}</p></section>
  if (!studentId) return <section className="empty-state"><UserRound/><h3>No student is linked</h3><p>Ask your School Admin to link your account to an active Parent or Student profile.</p></section>

  const children = me?.children || []
  return <>
    <section className="people-hero"><div><span>{me?.account?.role} portal</span><h2>My school information</h2><p>View only the records linked to your account.</p></div><UserRound/></section>
    {children.length > 1 && <label className="portal-child-picker">Viewing student<select value={studentId} onChange={e => setStudentId(e.target.value)}>{children.map(child => <option key={child.id} value={child.id}>{child.first_name} {child.last_name || ''} · {child.class_name} {child.section || ''}</option>)}</select></label>}
    <div className="portal-tabs">{tabs.map(([key,label,Icon]) => <button key={key} className={tab===key?'active':''} onClick={() => setTab(key)}><Icon size={16}/>{label}</button>)}</div>
    {error && <div className="api-notice"><b>Could not load portal data.</b><span>{error}</span></div>}
    {loading ? <div className="loading-grid"><i/><i/><i/></div> : <PortalData tab={tab} data={data?.data}/>} 
  </>
}

function PortalData({ tab, data }) {
  if (tab === 'overview') return <div className="stat-grid">
    <article><small>Attendance</small><b>{data?.attendance?.percentage ?? 0}%</b><span>{data?.attendance?.present || 0} present days</span></article>
    <article><small>Open assignments</small><b>{data?.assignments_open ?? 0}</b><span>Published and due</span></article>
    <article><small>Fee balance</small><b>₹{data?.fee_balance ?? 0}</b><span>Current outstanding amount</span></article>
    <article><small>Library loans</small><b>{data?.active_library_loans ?? 0}</b><span>Books currently issued</span></article>
  </div>
  if (tab === 'calendar') return <PortalCalendar rows={Array.isArray(data) ? data : []}/>
  const rows = Array.isArray(data) ? data : []
  if (!rows.length) return <section className="empty-state"><BookCheck/><h3>No records found</h3><p>There is no information to display for this student yet.</p></section>
  return <section className="data-panel"><div className="table-wrap"><table><thead><tr>{headers(tab).map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id || `${row.exam_id}-${row.subject_code}`}><Cells tab={tab} row={row}/></tr>)}</tbody></table></div></section>
}

function PortalCalendar({ rows }) {
  if (!rows.length) return <section className="empty-state"><CalendarCheck/><h3>No upcoming events</h3><p>New school events and holidays will appear here.</p></section>
  return <section className="calendar-event-grid">{rows.map(event=><article key={event.id} className="calendar-event published"><div className="calendar-event-date"><b>{new Date(event.starts_at).getDate()}</b><small>{new Date(event.starts_at).toLocaleString('default',{month:'short'})}</small></div><div><span>{event.event_type}</span><h3>{event.title}</h3><p>{event.description || 'No additional details.'}</p><small>{date(event.starts_at)} — {date(event.ends_at)}</small></div></article>)}</section>
}

function headers(tab) {
  return { attendance:['Date','Status','Remarks'], timetable:['Day','Time','Subject','Teacher','Room'], assignments:['Assignment','Subject','Due','Submission','Score'], results:['Exam','Subject','Marks','Grade'], fees:['Fee','Due date','Amount','Paid','Balance','Status'], library:['Book','Author','Due date','Status','Fine'] }[tab] || []
}

function Cells({ tab, row }) {
  if (tab==='attendance') return <><td>{date(row.attendance_date)}</td><td>{row.status}</td><td>{row.remarks || '—'}</td></>
  if (tab==='timetable') return <><td>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][row.weekday]}</td><td>{row.start_time} - {row.end_time}</td><td>{row.subject_name}</td><td>{row.teacher_name}</td><td>{row.room || '—'}</td></>
  if (tab==='assignments') return <><td><b>{row.title}</b><small>{row.description}</small></td><td>{row.subject_name}</td><td>{date(row.due_at)}</td><td>{row.submission_status || 'Not submitted'}</td><td>{row.score ?? '—'}</td></>
  if (tab==='results') return <><td>{row.exam_name}<small>{row.academic_year}</small></td><td>{row.subject_name}</td><td>{row.marks_obtained ?? '—'} / {row.max_marks}</td><td>{row.grade || '—'}</td></>
  if (tab==='fees') return <><td>{row.fee_name}</td><td>{date(row.due_date)}</td><td>₹{row.amount}</td><td>₹{row.paid_amount}</td><td>₹{row.balance}</td><td>{row.status}</td></>
  return <><td>{row.title}</td><td>{row.author}</td><td>{date(row.due_date)}</td><td>{row.status}</td><td>₹{row.fine_amount}</td></>
}
