import { CalendarCheck, Clock, Send, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function localInput(day, time) {
  return `${day}T${time}`
}

function display(value) {
  return value ? new Date(value).toLocaleString() : ''
}

export default function ParentTeacherMeetings({ user }) {
  const isAdmin = user.role === 'School Admin'
  const isTeacher = user.role === 'Teacher'
  const isParent = user.role === 'Parent'
  const [options, setOptions] = useState({ teachers: [], parents: [], students: [], modes: [] })
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [slotForm, setSlotForm] = useState({ teacher_id: '', day: tomorrow, start: '10:00', end: '10:15', mode: 'in_person', location: '', meeting_link: '', max_bookings: 1, notes: '' })
  const [bookingForm, setBookingForm] = useState({ slot_id: '', parent_id: '', student_id: '', agenda: '' })
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        const [opts, slotRows, bookingRows] = await Promise.all([
          schoolApi.meetingOptions(),
          schoolApi.meetingSlots({ status: 'active' }),
          schoolApi.meetingBookings({ status }),
        ])
        if (!active) return
        setOptions(opts)
        setSlots(slotRows.data || [])
        setBookings(bookingRows.data || [])
        const ownTeacher = opts.teachers?.[0]?.id || ''
        const ownParent = opts.parents?.[0]?.id || ''
        const ownStudent = opts.students?.[0]?.id || ''
        setSlotForm(form => ({ ...form, teacher_id: form.teacher_id || ownTeacher }))
        setBookingForm(form => ({ ...form, parent_id: form.parent_id || ownParent, student_id: form.student_id || ownStudent }))
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [refresh, status])

  async function mutate(action, done) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await action()
      setNotice(result.message)
      done?.()
      setRefresh(value => value + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function publishSlot(event) {
    event.preventDefault()
    mutate(() => schoolApi.createMeetingSlot({
      teacher_id: slotForm.teacher_id,
      slot_start: localInput(slotForm.day, slotForm.start),
      slot_end: localInput(slotForm.day, slotForm.end),
      mode: slotForm.mode,
      location: slotForm.location,
      meeting_link: slotForm.meeting_link,
      max_bookings: slotForm.max_bookings,
      notes: slotForm.notes,
    }), () => setSlotForm(form => ({ ...form, notes: '' })))
  }

  function bookSlot(event) {
    event.preventDefault()
    mutate(() => schoolApi.createMeetingBooking(bookingForm), () => setBookingForm(form => ({ ...form, agenda: '' })))
  }

  const availableSlots = slots.filter(slot => Number(slot.booked_count || 0) < Number(slot.max_bookings || 1))

  return <section className="meeting-management">
    <section className="people-hero meeting-hero"><div><span>Family communication</span><h2>Parent-teacher meetings</h2><p>Publish teacher availability, book parent meetings, and queue reminders.</p></div><CalendarCheck /></section>
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="success-notice" role="status">{notice}</div>}
    <div className="page-actions"><label>Status<select value={status} onChange={e => setStatus(e.target.value)}>{['all', 'booked', 'completed', 'cancelled'].map(value => <option key={value}>{value}</option>)}</select></label><button className="button button-small" disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
    {loading ? <p role="status">Loading meetings...</p> : <>
      {(isAdmin || isTeacher) && <form className="editor-card" onSubmit={publishSlot}><div className="editor-heading"><Clock /><div><h3>Publish available slot</h3><p>Teachers can publish their own availability. Admins can publish for any active teacher.</p></div></div><div className="field-grid three">
        <label>Teacher<select required value={slotForm.teacher_id} disabled={isTeacher} onChange={e => setSlotForm({ ...slotForm, teacher_id: e.target.value })}><option value="">Select teacher</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={slotForm.day} onChange={e => setSlotForm({ ...slotForm, day: e.target.value })} /></label>
        <label>Start time<input required type="time" value={slotForm.start} onChange={e => setSlotForm({ ...slotForm, start: e.target.value })} /></label>
        <label>End time<input required type="time" value={slotForm.end} onChange={e => setSlotForm({ ...slotForm, end: e.target.value })} /></label>
        <label>Mode<select value={slotForm.mode} onChange={e => setSlotForm({ ...slotForm, mode: e.target.value })}>{['in_person', 'online', 'phone'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Capacity<input required type="number" min="1" max="25" value={slotForm.max_bookings} onChange={e => setSlotForm({ ...slotForm, max_bookings: e.target.value })} /></label>
        <label>Location<input maxLength="180" value={slotForm.location} onChange={e => setSlotForm({ ...slotForm, location: e.target.value })} /></label>
        <label>Meeting link<input maxLength="500" value={slotForm.meeting_link} onChange={e => setSlotForm({ ...slotForm, meeting_link: e.target.value })} /></label>
        <label className="wide">Notes<textarea maxLength="1000" value={slotForm.notes} onChange={e => setSlotForm({ ...slotForm, notes: e.target.value })} /></label>
      </div><button className="button button-small" disabled={busy}><Send size={16} />Publish slot</button></form>}
      {(isAdmin || isParent) && <form className="editor-card" onSubmit={bookSlot}><div className="editor-heading"><UserRound /><div><h3>Book a meeting</h3><p>Parents book for linked children. A WhatsApp reminder is queued when mobile is available.</p></div></div><div className="field-grid">
        <label>Available slot<select required value={bookingForm.slot_id} onChange={e => setBookingForm({ ...bookingForm, slot_id: e.target.value })}><option value="">Select slot</option>{availableSlots.map(slot => <option key={slot.id} value={slot.id}>{display(slot.slot_start)} - {slot.teacher_name} ({slot.booked_count}/{slot.max_bookings})</option>)}</select></label>
        <label>Parent<select required value={bookingForm.parent_id} disabled={isParent && options.parents.length === 1} onChange={e => setBookingForm({ ...bookingForm, parent_id: e.target.value })}><option value="">Select parent</option>{options.parents.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Student<select required value={bookingForm.student_id} onChange={e => setBookingForm({ ...bookingForm, student_id: e.target.value })}><option value="">Select student</option>{options.students.filter(item => !bookingForm.parent_id || !item.parent_id || String(item.parent_id) === String(bookingForm.parent_id)).map(item => <option key={`${item.parent_id || 'admin'}-${item.id}`} value={item.id}>{item.name}{item.class_name ? ` - ${item.class_name} ${item.section || ''}` : ''}</option>)}</select></label>
        <label className="wide">Agenda<textarea maxLength="1000" value={bookingForm.agenda} onChange={e => setBookingForm({ ...bookingForm, agenda: e.target.value })} /></label>
      </div><button className="button button-small" disabled={busy || !availableSlots.length}><CalendarCheck size={16} />Book meeting</button></form>}
      <section className="data-panel"><div className="panel-title"><div><h2>Published slots</h2><p>{slots.length} active slots</p></div></div><div className="meeting-slot-grid">{slots.map(slot => <article key={slot.id}><Clock /><div><b>{slot.teacher_name}</b><small>{display(slot.slot_start)} to {display(slot.slot_end)}</small><small>{slot.mode} {slot.location ? `- ${slot.location}` : ''}</small></div><span className="delivery-status active">{slot.booked_count}/{slot.max_bookings}</span>{(isAdmin || isTeacher) && <button className="refresh-button danger" disabled={busy} onClick={() => mutate(() => schoolApi.cancelMeetingSlot(slot.id, { reason: 'Slot cancelled from website.' }))}>Cancel</button>}</article>)}{!slots.length && <div className="empty-state"><CalendarCheck /><h3>No active slots</h3><p>Publish availability to start accepting bookings.</p></div>}</div></section>
      <section className="data-panel meeting-table"><div className="panel-title"><div><h2>Bookings</h2><p>{bookings.length} records</p></div></div><div className="table-wrap"><table><thead><tr><th>Meeting</th><th>Family</th><th>Mode</th><th>Status</th><th>Agenda</th><th>Actions</th></tr></thead><tbody>{bookings.map(row => <tr key={row.id}><td><b>{display(row.slot_start)}</b><small>{row.teacher_name}</small></td><td>{row.parent_name}<small>{row.student_name} - {row.class_name} {row.section}</small></td><td>{row.mode}<small>{row.location || row.meeting_link}</small></td><td><span className={`delivery-status ${row.status}`}>{row.status}</span></td><td>{row.agenda || '-'}</td><td>{row.status === 'booked' ? <div className="meeting-actions">{(isAdmin || isTeacher) && <button disabled={busy} onClick={() => mutate(() => schoolApi.updateMeetingBookingStatus(row.id, { status: 'completed' }))}>Complete</button>}<button disabled={busy} onClick={() => mutate(() => schoolApi.updateMeetingBookingStatus(row.id, { status: 'cancelled', reason: 'Cancelled from website.' }))}>Cancel</button></div> : '-'}</td></tr>)}{!bookings.length && <tr><td colSpan="6">No meeting bookings match this status.</td></tr>}</tbody></table></div></section>
    </>}
  </section>
}
