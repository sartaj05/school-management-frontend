import { BookCheck, CalendarCheck, CircleDollarSign, LibraryBig, Award, UserRound, Download, Send, CreditCard, FileText, Bell, CheckCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const tabs = [
  ['overview', 'Overview', UserRound], ['attendance', 'Attendance', CalendarCheck],
  ['timetable', 'Timetable', CalendarCheck], ['assignments', 'Assignments', BookCheck],
  ['results', 'Results', Award], ['fees', 'Fees', CircleDollarSign], ['library', 'Library', LibraryBig], ['documents', 'Documents', FileText], ['notifications', 'Notifications', Bell], ['calendar', 'Calendar', CalendarCheck],
]

const date = value => value ? new Date(value).toLocaleDateString() : '—'

export default function ParentStudentPortal() {
  const [me, setMe] = useState(null), [studentId, setStudentId] = useState(''), [tab, setTab] = useState('overview')
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [revision, setRevision] = useState(0)

  useEffect(() => {
    schoolApi.portalMe().then(result => {
      setMe(result)
      const initial = result.student?.id || result.children?.[0]?.id || ''
      setStudentId(initial ? String(initial) : '')
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!studentId) return
    const methods = { overview: schoolApi.portalOverview, attendance: schoolApi.portalAttendance, timetable: schoolApi.portalTimetable, assignments: schoolApi.portalAssignments, results: schoolApi.portalResults, fees: schoolApi.portalFees, library: schoolApi.portalLibraryLoans, documents: schoolApi.portalDocuments, notifications: schoolApi.portalNotifications, calendar: schoolApi.calendarEvents }
    setLoading(true); setError(''); setData(null)
    const portalRequest = ['calendar', 'notifications'].includes(tab) ? methods[tab]() : methods[tab](studentId)
    portalRequest.then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [tab, studentId, revision])

  if (loading && !me) return <div className="loading-grid"><i/><i/><i/></div>
  if (error && !me) return <section className="empty-state"><UserRound/><h3>Portal access is not ready</h3><p>{error}</p></section>
  if (!studentId) return <section className="empty-state"><UserRound/><h3>No student is linked</h3><p>Ask your School Admin to link your account to an active Parent or Student profile.</p></section>

  const children = me?.children || []
  return <>
    <section className="people-hero"><div><span>{me?.account?.role} portal</span><h2>My school information</h2><p>View records, submit homework, pay fees, and download school documents.</p></div><UserRound/></section>
    {children.length > 1 && <label className="portal-child-picker">Viewing student<select value={studentId} onChange={e => setStudentId(e.target.value)}>{children.map(child => <option key={child.id} value={child.id}>{child.first_name} {child.last_name || ''} · {child.class_name} {child.section || ''}</option>)}</select></label>}
    <div className="portal-tabs">{tabs.map(([key,label,Icon]) => <button key={key} className={tab===key?'active':''} onClick={() => setTab(key)}><Icon size={16}/>{label}</button>)}</div>
    {error && <div className="api-notice"><b>Could not load portal data.</b><span>{error}</span></div>}
    {loading ? <div className="loading-grid"><i/><i/><i/></div> : <PortalData tab={tab} data={data?.data} unreadCount={data?.unread_count} studentId={studentId} onChanged={() => setRevision(value => value + 1)} />}
  </>
}

function PortalData({ tab, data, unreadCount, studentId, onChanged }) {
  if (tab === 'overview') return <div className="stat-grid">
    <article><small>Attendance</small><b>{data?.attendance?.percentage ?? 0}%</b><span>{data?.attendance?.present || 0} present days</span></article>
    <article><small>Open assignments</small><b>{data?.assignments_open ?? 0}</b><span>Published and due</span></article>
    <article><small>Fee balance</small><b>₹{data?.fee_balance ?? 0}</b><span>Current outstanding amount</span></article>
    <article><small>Library loans</small><b>{data?.active_library_loans ?? 0}</b><span>Books currently issued</span></article>
  </div>
  if (tab === 'calendar') return <PortalCalendar rows={Array.isArray(data) ? data : []}/>
  const rows = Array.isArray(data) ? data : []
  if (tab === 'assignments') return <PortalAssignments rows={rows} onChanged={onChanged}/>
  if (tab === 'fees') return <PortalFees rows={rows} onChanged={onChanged}/>
  if (tab === 'documents') return <PortalDocuments rows={rows} studentId={studentId}/>
  if (tab === 'notifications') return <PortalNotifications rows={rows} unreadCount={unreadCount} onChanged={onChanged}/>
  if (!rows.length) return <section className="empty-state"><BookCheck/><h3>No records found</h3><p>There is no information to display for this student yet.</p></section>
  return <section className="data-panel"><div className="table-wrap"><table><thead><tr>{headers(tab).map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id || `${row.exam_id}-${row.subject_code}`}><Cells tab={tab} row={row}/></tr>)}</tbody></table></div></section>
}

function PortalCalendar({ rows }) {
  if (!rows.length) return <section className="empty-state"><CalendarCheck/><h3>No upcoming events</h3><p>New school events and holidays will appear here.</p></section>
  return <section className="calendar-event-grid">{rows.map(event=><article key={event.id} className="calendar-event published"><div className="calendar-event-date"><b>{new Date(event.starts_at).getDate()}</b><small>{new Date(event.starts_at).toLocaleString('default',{month:'short'})}</small></div><div><span>{event.event_type}</span><h3>{event.title}</h3><p>{event.description || 'No additional details.'}</p><small>{date(event.starts_at)} — {date(event.ends_at)}</small></div></article>)}</section>
}

function PortalAssignments({ rows, onChanged }) {
  const [drafts, setDrafts] = useState({}), [busy, setBusy] = useState(null), [message, setMessage] = useState(''), [error, setError] = useState('')
  const value = (row, key) => drafts[row.id]?.[key] ?? row[key] ?? ''
  const edit = (row, key, next) => setDrafts(current => ({ ...current, [row.id]: { ...current[row.id], [key]: next } }))
  async function submit(row) {
    setBusy(row.id); setError(''); setMessage('')
    try { const result = await schoolApi.portalSubmitAssignment(row.id, { content: value(row, 'content'), attachment_url: value(row, 'attachment_url') }); setMessage(result.message); onChanged() }
    catch (e) { setError(e.message) } finally { setBusy(null) }
  }
  return <section className="data-panel portal-action-panel"><div className="panel-title"><div><span>Learning tasks</span><h2>Homework submission</h2></div><b>{rows.length} assignments</b></div>{message && <div className="success-notice">{message}</div>}{error && <div className="form-error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Assignment</th><th>Due</th><th>Your submission</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.title}</b><small>{row.subject_name}</small><small>{row.description}</small></td><td>{date(row.due_at)}<small>{row.status}</small></td><td><textarea rows="2" value={value(row, 'content')} onChange={e => edit(row, 'content', e.target.value)} placeholder="Write your answer" disabled={row.submission_status === 'graded'} /><input value={value(row, 'attachment_url')} onChange={e => edit(row, 'attachment_url', e.target.value)} placeholder="Attachment URL (optional)" disabled={row.submission_status === 'graded'} /></td><td><button className="button button-small" onClick={() => submit(row)} disabled={busy === row.id || row.submission_status === 'graded'}><Send size={14} />{row.submission_status === 'graded' ? 'Graded' : busy === row.id ? 'Saving…' : 'Submit homework'}</button>{row.submission_status && <small className="portal-action-status">Status: {row.submission_status}</small>}</td></tr>)}</tbody></table></div></section>
}

function PortalFees({ rows, onChanged }) {
  const [busy, setBusy] = useState(null), [message, setMessage] = useState(''), [error, setError] = useState('')
  async function pay(row) {
    if (!await confirmPopup({ title: `Pay ${row.fee_name}?`, message: `Record an online payment of ₹${row.balance} for this invoice.`, confirmLabel: 'Pay online', tone: 'primary' })) return
    setBusy(row.id); setError(''); setMessage('')
    try { const result = await schoolApi.portalPayFee(row.id, { amount: row.balance }); setMessage(`${result.message} Reference: ${result.reference_number}`); onChanged() }
    catch (e) { setError(e.message) } finally { setBusy(null) }
  }
  return <section className="data-panel portal-action-panel"><div className="panel-title"><div><span>Account statements</span><h2>Fee payments</h2></div><b>{rows.length} invoices</b></div>{message && <div className="success-notice">{message}</div>}{error && <div className="form-error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Fee</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.fee_name}<small>{row.status}</small></td><td>{date(row.due_date)}</td><td>₹{row.amount}</td><td>₹{row.paid_amount}</td><td><b>₹{row.balance}</b></td><td>{Number(row.balance) > 0 ? <button className="button button-small" onClick={() => pay(row)} disabled={busy === row.id}><CreditCard size={14} />{busy === row.id ? 'Processing…' : 'Pay online'}</button> : <span className="status-pill">Paid</span>}</td></tr>)}</tbody></table></div></section>
}

function PortalDocuments({ rows, studentId }) {
  const [busy, setBusy] = useState(null), [error, setError] = useState('')
  async function download(row) {
    setBusy(row.exam_id); setError('')
    try { await schoolApi.downloadPortalReportCard(row.exam_id, studentId) } catch (e) { setError(e.message) } finally { setBusy(null) }
  }
  return <section className="data-panel portal-action-panel"><div className="panel-title"><div><span>Published records</span><h2>Downloadable documents</h2></div><b>{rows.length} documents</b></div>{error && <div className="form-error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Document</th><th>Academic year</th><th>Exam period</th><th>Class</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.exam_id}><td><b>Report card</b><small>{row.exam_name}</small></td><td>{row.academic_year}</td><td>{date(row.start_date)} — {date(row.end_date)}</td><td>{row.class_name} {row.section}</td><td><button className="button button-small" onClick={() => download(row)} disabled={busy === row.exam_id}><Download size={14} />{busy === row.exam_id ? 'Preparing…' : 'Download'}</button></td></tr>)}</tbody></table></div></section>
}

function PortalNotifications({ rows, unreadCount = 0, onChanged }) {
  const [busy, setBusy] = useState(null), [error, setError] = useState('')

  async function markRead(notificationId) {
    setBusy(notificationId); setError('')
    try { await schoolApi.markPortalNotificationRead(notificationId); onChanged() }
    catch (e) { setError(e.message) } finally { setBusy(null) }
  }

  async function markAllRead() {
    setBusy('all'); setError('')
    try { await schoolApi.markAllPortalNotificationsRead(); onChanged() }
    catch (e) { setError(e.message) } finally { setBusy(null) }
  }

  return <section className="data-panel portal-notifications"><div className="panel-title"><div><span>School communication</span><h2>Notification inbox</h2></div><div className="portal-notification-toolbar"><b>{unreadCount} unread</b>{unreadCount > 0 && <button className="button button-small" onClick={markAllRead} disabled={busy === 'all'}><CheckCheck size={14}/>{busy === 'all' ? 'Updating…' : 'Mark all read'}</button>}</div></div>{error && <div className="form-error">{error}</div>}{!rows.length ? <div className="empty-state"><Bell/><h3>Your inbox is clear</h3><p>School announcements and reminders will appear here.</p></div> : <div className="portal-notification-list">{rows.map(row => <article key={row.id} className={row.is_read ? 'portal-notification' : 'portal-notification unread'}><span className="portal-notification-icon"><Bell size={17}/></span><div className="portal-notification-copy"><div><b>{row.title}</b>{!row.is_read && <span className="portal-unread-badge">New</span>}</div><p>{row.message}</p><small>{date(row.created_at)}{row.status ? ` · ${row.status}` : ''}</small></div>{!row.is_read && <button className="button button-small" onClick={() => markRead(row.id)} disabled={busy === row.id}>{busy === row.id ? 'Saving…' : 'Mark read'}</button>}</article>)}</div>}</section>
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
