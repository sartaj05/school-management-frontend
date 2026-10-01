/* eslint-disable react-hooks/set-state-in-effect */
import { ChevronLeft, ChevronRight, GraduationCap, PhoneCall, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const statuses = ['submitted', 'under_review', 'approved', 'rejected', 'enrolled']
const sources = ['all', 'website', 'walk_in', 'referral', 'phone', 'social', 'other']
const blankFollowUp = { channel: 'phone', notes: '', outcome: 'connected', next_follow_up_at: '' }
const label = value => String(value || '').replaceAll('_', ' ')

export default function AdmissionManagement() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({ total: 0, enrolled: 0, due_follow_ups: 0, conversion_rate: 0, by_status: {} })
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')
  const [dueOnly, setDueOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageInfo, setPageInfo] = useState({ total: 0, total_pages: 1 })
  const [section, setSection] = useState('A')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [followUpFor, setFollowUpFor] = useState(null)
  const [followUps, setFollowUps] = useState([])
  const [followUp, setFollowUp] = useState(blankFollowUp)

  const load = async () => {
    setBusy(true)
    setError('')
    try {
      const [result, summaryResult] = await Promise.all([
        schoolApi.admissionApplications(status, { q: query.trim(), source, follow_up: dueOnly ? 'due' : '', page, per_page: 10 }),
        schoolApi.admissionSummary(),
      ])
      setRows(result.data || [])
      setPageInfo({ total: result.total || 0, total_pages: result.total_pages || 1 })
      setSummary(summaryResult.data || {})
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // load reads the active CRM filters and is intentionally refreshed when any filter changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [status, source, dueOnly, query, page])

  async function save(row, nextStatus) {
    if (nextStatus === 'enrolled' && row.status !== 'enrolled' && !await confirmPopup({
      title: `Enroll ${row.student_first_name} ${row.student_last_name || ''}?`,
      message: `This creates an active student record, a guardian record, and assigns the student to ${row.applying_class} / section ${section}.`,
      confirmLabel: 'Enroll student',
      tone: 'primary',
    })) return
    try {
      const result = await schoolApi.updateAdmissionApplication(row.id, { status: nextStatus, admin_notes: row.admin_notes || '', section })
      setNotice(result.message)
      await load()
    } catch (e) { setError(e.message) }
  }

  async function openFollowUps(row) {
    setError('')
    try {
      const result = await schoolApi.admissionFollowUps(row.id)
      setFollowUps(result.data || [])
      setFollowUpFor(row)
      setFollowUp(blankFollowUp)
    } catch (e) { setError(e.message) }
  }

  async function addFollowUp(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await schoolApi.addAdmissionFollowUp(followUpFor.id, followUp)
      setNotice(result.message)
      setFollowUpFor(null)
      await load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return <>
    <section className="people-hero"><div><span>Admissions CRM</span><h2>Turn enquiries into enrolled students.</h2><p>Track every application, follow up with families, and convert approved applicants into linked student and guardian records.</p></div><GraduationCap /></section>
    <section className="people-stat-grid admission-stat-grid">
      <article><span>Total enquiries</span><b>{summary.total || 0}</b><small>{summary.by_status?.submitted || 0} newly submitted</small></article>
      <article><span>Needs follow-up</span><b>{summary.due_follow_ups || 0}</b><small>scheduled conversations due</small></article>
      <article><span>Enrolled</span><b>{summary.enrolled || 0}</b><small>{summary.conversion_rate || 0}% conversion rate</small></article>
      <article><span>Under review</span><b>{summary.by_status?.under_review || 0}</b><small>active admissions pipeline</small></article>
    </section>
    <div className="admission-toolbar">
      <label><Search size={16} /><input value={query} placeholder="Search applicant, guardian, phone or application" onChange={event => { setQuery(event.target.value); setPage(1) }} /></label>
      <select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}>{['all', ...statuses].map(item => <option key={item} value={item}>{item === 'all' ? 'All statuses' : label(item)}</option>)}</select>
      <select value={source} onChange={event => { setSource(event.target.value); setPage(1) }}>{sources.map(item => <option key={item} value={item}>{item === 'all' ? 'All sources' : label(item)}</option>)}</select>
      <button type="button" className={`button button-small ${dueOnly ? '' : 'secondary'}`} onClick={() => { setDueOnly(value => !value); setPage(1) }}>{dueOnly ? 'Showing due follow-ups' : 'Due follow-ups'}</button>
      <label className="admission-section-field">Enrollment section<input value={section} maxLength="20" onChange={event => setSection(event.target.value)} /></label>
    </div>
    {error && <div className="form-error">{error}</div>}{notice && <div className="success-notice">{notice}</div>}
    {busy ? <div className="loading-grid"><i /><i /><i /></div> : <section className="data-panel"><div className="panel-title"><div><span>Pipeline</span><h2>Applications and follow-ups</h2></div><b>{pageInfo.total} total</b></div><div className="table-wrap"><table><thead><tr><th>Application</th><th>Student</th><th>Class</th><th>Guardian</th><th>Source</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.application_no}</b><small>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</small></td><td>{row.student_first_name} {row.student_last_name || ''}<small>{row.follow_up_count || 0} follow-ups{row.next_follow_up_at ? ` · next ${new Date(row.next_follow_up_at).toLocaleString()}` : ''}</small></td><td>{row.applying_class}<small>{row.enrolled_student_id ? 'Enrollment completed' : `Section ${section} on enrollment`}</small></td><td>{row.guardian_name}<small>{row.guardian_mobile}</small></td><td>{label(row.source || 'website')}</td><td>{row.assigned_to_name ? <><b>{row.assigned_to_name}</b><small>{row.assigned_to_email}</small></> : <small>Unassigned</small>}</td><td><span className={`status-pill ${row.status === 'rejected' ? 'inactive' : ''}`}>{label(row.status)}</span></td><td><div className="admission-actions"><select value={row.status} onChange={event => save(row, event.target.value)}>{statuses.map(item => <option key={item} value={item}>{item === 'enrolled' ? 'enrolled creates records' : label(item)}</option>)}</select><button className="button button-small" onClick={() => openFollowUps(row)}><PhoneCall size={14} />Follow-up</button></div></td></tr>)}{!rows.length && <tr><td colSpan="8">No applications match these filters.</td></tr>}</tbody></table></div><div className="school-pagination"><span>Page {page} of {pageInfo.total_pages}</span><div><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft /></button><button disabled={page >= pageInfo.total_pages} onClick={() => setPage(value => value + 1)}><ChevronRight /></button></div></div></section>}
    {followUpFor && <div className="admission-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setFollowUpFor(null) }}><section className="editor-card admission-follow-up-modal"><div className="editor-heading"><PhoneCall /><div><h3>Family follow-up</h3><p>{followUpFor.application_no} · {followUpFor.student_first_name} {followUpFor.student_last_name || ''}</p></div></div>{followUps.length > 0 && <div className="admission-follow-up-history">{followUps.map(item => <article key={item.id}><b>{label(item.channel)} · {item.outcome || 'contacted'}</b><small>{item.contacted_at ? new Date(item.contacted_at).toLocaleString() : '-'}</small><p>{item.notes}</p></article>)}</div>}<form onSubmit={addFollowUp}><div className="field-grid three"><label>Channel<select value={followUp.channel} onChange={event => setFollowUp({ ...followUp, channel: event.target.value })}>{['phone', 'email', 'whatsapp', 'meeting', 'sms', 'other'].map(item => <option key={item}>{item}</option>)}</select></label><label>Outcome<select value={followUp.outcome} onChange={event => setFollowUp({ ...followUp, outcome: event.target.value })}>{['connected', 'no_answer', 'interested', 'documents_pending', 'visit_scheduled', 'not_interested'].map(item => <option key={item}>{label(item)}</option>)}</select></label><label>Next follow-up<input type="datetime-local" value={followUp.next_follow_up_at} onChange={event => setFollowUp({ ...followUp, next_follow_up_at: event.target.value })} /></label><label className="wide">Notes<textarea required rows="3" value={followUp.notes} onChange={event => setFollowUp({ ...followUp, notes: event.target.value })} placeholder="Record what the family said and the next action." /></label></div><div className="admission-modal-actions"><button type="button" className="button button-small secondary" onClick={() => setFollowUpFor(null)}>Close</button><button className="button button-small" disabled={busy}>Save follow-up</button></div></form></section></div>}
  </>
}
