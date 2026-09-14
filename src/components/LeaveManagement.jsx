import { CalendarCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const currentYear = new Date().getFullYear()
const types = ['casual', 'sick', 'earned']

export default function LeaveManagement({ user }) {
  const admin = user.role === 'School Admin'
  const [people, setPeople] = useState([])
  const [selected, setSelected] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [status, setStatus] = useState('all')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])
  const [balances, setBalances] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' })
  const [allowance, setAllowance] = useState({ leave_type: 'casual', days: '', notes: '' })
  const [review, setReview] = useState(null)
  const [decision, setDecision] = useState('approved')
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState([])
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const person = people.find(item => `${item.person_type}:${item.person_id}` === selected)
  const validYear = /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100

  useEffect(() => {
    let active = true
    schoolApi.leaveOptions().then(result => {
      if (!active) return
      setPeople(result.people)
      if (!admin && result.people.length) setSelected(`${result.people[0].person_type}:${result.people[0].person_id}`)
    }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [admin])

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      if (!validYear || (!admin && !selected)) { setLoading(false); return }
      setLoading(true)
      setError('')
      const [person_type, person_id] = selected.split(':')
      const filters = { year, status, offset, limit: 25, ...(selected ? { person_type, person_id } : {}) }
      try {
        const [requests, balance, audit] = await Promise.all([
          schoolApi.leaveRequests(filters),
          selected ? schoolApi.leaveBalances({ person_type, person_id, year }) : Promise.resolve({ data: [] }),
          selected ? schoolApi.leaveAllowanceHistory({ person_type, person_id }) : Promise.resolve({ data: [] }),
        ])
        if (active) { setRows(requests.data); setTotal(requests.total); setBalances(balance.data); setAdjustments(audit.data) }
      } catch (err) { if (active) { setError(err.message); setRows([]); setBalances([]); setAdjustments([]) } }
      finally { if (active) setLoading(false) }
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [selected, year, status, offset, refresh, admin, validYear])

  useEffect(() => {
    let active = true
    if (review) schoolApi.leaveHistory(review.id).then(result => { if (active) setHistory(result.data) }).catch(err => { if (active) setError(err.message) })
    return () => { active = false }
  }, [review])

  async function mutate(action, done) {
    setBusy(true); setError(''); setNotice('')
    try { const result = await action(); setNotice(result.message); done?.(); setRefresh(value => value + 1) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  function submit(event) {
    event.preventDefault()
    if (!person) return
    mutate(() => schoolApi.createLeaveRequest({ ...form, person_type: person.person_type, person_id: person.person_id }), () => {
      setYear(form.start_date.slice(0, 4)); setOffset(0); setStatus('all'); setForm({ ...form, reason: '' })
    })
  }

  function saveAllowance(event) {
    event.preventDefault()
    if (!person) return
    mutate(() => schoolApi.setLeaveAllowance({ ...allowance, year, person_type: person.person_type, person_id: person.person_id }), () => setAllowance({ ...allowance, notes: '' }))
  }

  function openReview(row) {
    setHistory([]); setNotes(''); setDecision(admin && row.status === 'pending' ? 'approved' : 'cancelled'); setReview(row)
  }

  const canDecide = review && (review.status === 'pending' || (admin && review.status === 'approved'))

  return <>
    <section className="people-hero"><div><span>School operations</span><h2>Leave management</h2><p>Request time off, track annual balances, and review decisions.</p></div><CalendarCheck /></section>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="success-notice" role="status">{notice}</div>}
    <div className="page-actions">
      {admin && <label>Person<select value={selected} disabled={busy} onChange={e => { setSelected(e.target.value); setOffset(0); setReview(null) }}><option value="">All requests</option>{people.map(item => <option key={`${item.person_type}:${item.person_id}`} value={`${item.person_type}:${item.person_id}`}>{item.name} ({item.person_type}{item.status !== 'active' ? ', inactive' : ''})</option>)}</select></label>}
      {!admin && <b>{person?.name || 'A linked active profile is required.'}</b>}
      <label>Calendar year<input type="number" min="2000" max="2100" value={year} onChange={e => { setYear(e.target.value); setOffset(0) }} /></label>
      <label>Status<select value={status} onChange={e => { setStatus(e.target.value); setOffset(0) }}>{['all', 'pending', 'approved', 'rejected', 'cancelled'].map(value => <option key={value}>{value}</option>)}</select></label>
      <button className="button button-small" disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
    </div>
    {!validYear && <div className="form-error">Enter a year between 2000 and 2100.</div>}
    {loading ? <p role="status">Loading leave records...</p> : <>
      {!!balances.length && <section className="data-panel"><div className="panel-title"><div><h2>{year} leave balances</h2><p>Whole calendar days, including weekends. Pending requests reserve days. Allowances start at zero.</p></div></div><div className="table-wrap"><table><thead><tr><th>Type</th><th>Allowance</th><th>Used</th><th>Pending</th><th>Remaining</th><th>Available to request</th></tr></thead><tbody>{balances.map(row => <tr key={row.leave_type}><td>{row.leave_type}</td><td>{row.allowance}</td><td>{row.used}</td><td>{row.pending}</td><td>{row.remaining}</td><td>{row.available}</td></tr>)}</tbody></table></div></section>}
      {person?.status === 'active' && <form className="editor-card" onSubmit={submit}><div className="editor-heading"><CalendarCheck /><div><h3>Request leave for {person.name}</h3><p>Use dates within one calendar year. Split requests that cross New Year.</p></div></div><div className="field-grid">
        <label>Leave type<select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>{types.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Start date<input required type="date" min="2000-01-01" max="2100-12-31" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></label>
        <label>End date<input required type="date" min={form.start_date || '2000-01-01'} max={form.start_date ? `${form.start_date.slice(0, 4)}-12-31` : '2100-12-31'} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></label>
        <label className="wide">Reason<textarea required maxLength="2000" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label>
      </div><button className="button button-small" disabled={busy}>Submit leave request</button></form>}
      {admin && person && <form className="editor-card" onSubmit={saveAllowance}><div className="editor-heading"><div><h3>Set {year} annual allowance</h3><p>Enter the total annual entitlement for {person.name}. Every adjustment is recorded.</p></div></div><div className="field-grid"><label>Leave type<select value={allowance.leave_type} onChange={e => setAllowance({ ...allowance, leave_type: e.target.value })}>{types.map(type => <option key={type}>{type}</option>)}</select></label><label>Total days<input required type="number" min="0" max="366" step="1" value={allowance.days} onChange={e => setAllowance({ ...allowance, days: e.target.value })} /></label><label className="wide">Adjustment reason<textarea required maxLength="1900" value={allowance.notes} onChange={e => setAllowance({ ...allowance, notes: e.target.value })} /></label></div><button className="button button-small" disabled={busy || !validYear}>Save allowance</button></form>}
      <section className="data-panel"><div className="panel-title"><div><h2>Leave requests</h2><p>{total} records</p></div></div><div className="table-wrap"><table><thead><tr><th>Person</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reason</th><th>Review / history</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.person_name}<small> ({row.person_type})</small></td><td>{row.leave_type}</td><td>{row.start_date} to {row.end_date}</td><td>{row.days}</td><td>{row.status}</td><td>{row.reason}</td><td><button className="button button-small" disabled={busy} onClick={() => openReview(row)}>Open #{row.id}</button></td></tr>)}{!rows.length && <tr><td colSpan="7">No leave requests match these filters.</td></tr>}</tbody></table></div><div className="page-actions"><button disabled={offset === 0 || busy} onClick={() => setOffset(value => Math.max(0, value - 25))}>Previous</button><span>Page {Math.floor(offset / 25) + 1}</span><button disabled={offset + 25 >= total || busy} onClick={() => setOffset(value => value + 25)}>Next</button></div></section>
    </>}
    {review && <section className="editor-card"><div className="panel-title"><h2>Request #{review.id}: {review.person_name}</h2><button disabled={busy} onClick={() => setReview(null)}>Close</button></div><p>{review.start_date} to {review.end_date} · {review.status}</p><p>{review.reason}</p>
      {canDecide && <form onSubmit={event => { event.preventDefault(); mutate(() => schoolApi.updateLeaveStatus(review.id, { status: decision, notes }), () => setReview(null)) }}><div className="field-grid"><label>Decision<select value={decision} onChange={e => setDecision(e.target.value)}>{admin && review.status === 'pending' && <><option value="approved">Approve</option><option value="rejected">Reject</option></>}<option value="cancelled">Cancel request</option></select></label><label>Decision note<textarea required={decision === 'rejected'} maxLength="2000" value={notes} onChange={e => setNotes(e.target.value)} /></label></div><button className="button button-small" disabled={busy}>Confirm decision</button></form>}
      <h3>History</h3>{history.map(item => <p key={item.id}><b>{item.action}</b> · {new Date(item.created_at).toLocaleString()} · User #{item.actor_id}<br />{item.notes}</p>)}
    </section>}
    {!!adjustments.length && <section className="editor-card"><h3>Allowance history (latest 100 changes, all years)</h3>{adjustments.map(item => <p key={item.id}>{item.notes}<br /><small>{new Date(item.created_at).toLocaleString()} · User #{item.actor_id}</small></p>)}</section>}
  </>
}
