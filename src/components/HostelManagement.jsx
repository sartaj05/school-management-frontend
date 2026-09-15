import { Bed, Building2, ClipboardCheck, LogOut, Plus, RefreshCw, Save, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const today = new Date().toISOString().slice(0, 10)
const phoneValue = value => {
  const digits = String(value || '').replace(/\D/g, '')
  const normalized = digits.startsWith('91') ? digits.slice(0, 12) : `91${digits.slice(0, 10)}`
  return normalized.length <= 2 ? '+91' : `+${normalized}`
}
const emptyBuilding = { name: '', code: '', gender: 'mixed', warden_user_id: '', address: '', status: 'active' }
const emptyRoom = { building_id: '', room_no: '', floor: '', capacity: 4, monthly_fee: 0, notes: '', status: 'active' }
const emptyBed = { room_id: '', bed_no: '', status: 'available' }
const emptyAllocation = { student_id: '', bed_id: '', start_date: today, guardian_contact: '+91', emergency_contact: '+91', notes: '' }
const emptyAttendance = { student_id: '', attendance_date: today, meal_period: 'night', status: 'present', remarks: '' }
const emptyVisitor = { student_id: '', visitor_name: '', relation: '', mobile: '+91', purpose: '' }

export default function HostelManagement() {
  const [summary, setSummary] = useState({})
  const [buildings, setBuildings] = useState([])
  const [rooms, setRooms] = useState([])
  const [allocations, setAllocations] = useState([])
  const [visitors, setVisitors] = useState([])
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [buildingForm, setBuildingForm] = useState(emptyBuilding)
  const [roomForm, setRoomForm] = useState(emptyRoom)
  const [bedForm, setBedForm] = useState(emptyBed)
  const [allocationForm, setAllocationForm] = useState(emptyAllocation)
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendance)
  const [visitorForm, setVisitorForm] = useState(emptyVisitor)
  const [attendance, setAttendance] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const activeBeds = useMemo(() => rooms.flatMap(room => (room.beds || []).filter(bed => bed.status === 'available').map(bed => ({ ...bed, room_no: room.room_no, building_name: room.building_name }))), [rooms])
  const residents = useMemo(() => allocations.filter(item => item.status === 'active'), [allocations])

  async function load() {
    setBusy(true)
    setError('')
    try {
      const [summaryData, buildingData, roomData, allocationData, visitorData, optionData] = await Promise.all([
        schoolApi.hostelSummary(),
        schoolApi.hostelBuildings(),
        schoolApi.hostelRooms(),
        schoolApi.hostelAllocations(),
        schoolApi.hostelVisitors(),
        schoolApi.hostelOptions(),
      ])
      setSummary(summaryData.summary || {})
      setBuildings(buildingData.data || [])
      setRooms(roomData.data || [])
      setAllocations(allocationData.data || [])
      setVisitors(visitorData.data || [])
      setStudents(optionData.students || [])
      setStaff(optionData.hostel_staff || [])
      await loadAttendance(attendanceForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function loadAttendance(values = attendanceForm) {
    const result = await schoolApi.hostelAttendance({ attendance_date: values.attendance_date, meal_period: values.meal_period })
    setAttendance(result.data || [])
  }

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [])

  async function saveBuilding(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createHostelBuilding({ ...buildingForm, warden_user_id: buildingForm.warden_user_id || null })
      setMessage(result.message); setBuildingForm(emptyBuilding); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveRoom(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createHostelRoom({ ...roomForm, building_id: Number(roomForm.building_id), capacity: Number(roomForm.capacity), monthly_fee: Number(roomForm.monthly_fee || 0) })
      setMessage(result.message); setRoomForm(emptyRoom); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveBed(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createHostelBed(bedForm.room_id, { bed_no: bedForm.bed_no, status: bedForm.status })
      setMessage(result.message); setBedForm({ ...emptyBed, room_id: bedForm.room_id }); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveAllocation(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createHostelAllocation({ ...allocationForm, student_id: Number(allocationForm.student_id), bed_id: Number(allocationForm.bed_id) })
      setMessage(result.message); setAllocationForm(emptyAllocation); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function releaseAllocation(item) {
    if (!await confirmPopup({ title: `Release ${item.student_name}?`, message: 'This will free the bed and close the active hostel allocation.', confirmLabel: 'Release bed', tone: 'danger' })) return
    setBusy(true)
    try { const result = await schoolApi.releaseHostelAllocation(item.id); setMessage(result.message); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveAttendance(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.markHostelAttendance({ ...attendanceForm, student_id: Number(attendanceForm.student_id) })
      setMessage(result.message); await loadAttendance(attendanceForm)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveVisitor(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createHostelVisitor({ ...visitorForm, student_id: Number(visitorForm.student_id) })
      setMessage(result.message); setVisitorForm(emptyVisitor); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function checkoutVisitor(item) {
    setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.checkoutHostelVisitor(item.id); setMessage(result.message); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="hostel-management">
    <div className="stat-grid compact hostel-stats">{[
      ['Buildings', summary.active_buildings || 0],
      ['Rooms', summary.active_rooms || 0],
      ['Beds', summary.total_beds || 0],
      ['Available', summary.available_beds || 0],
      ['Residents', summary.residents || 0],
      ['Visitors', summary.visitors_inside || 0],
    ].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span>hostel</span></article>)}</div>
    {error && <div className="form-error">{error}</div>}
    {message && <div className="success-notice">{message}</div>}

    <div className="hostel-editor-grid">
      <form className="editor-card" onSubmit={saveBuilding}>
        <div className="editor-heading"><Building2/><div><h3>Add hostel building</h3><p>Create premium hostel blocks and assign a hostel user as warden.</p></div></div>
        <div className="field-grid three">
          <label>Name *<input required value={buildingForm.name} onChange={e => setBuildingForm({ ...buildingForm, name: e.target.value })}/></label>
          <label>Code<input value={buildingForm.code} onChange={e => setBuildingForm({ ...buildingForm, code: e.target.value })}/></label>
          <label>Gender<select value={buildingForm.gender} onChange={e => setBuildingForm({ ...buildingForm, gender: e.target.value })}><option value="mixed">Mixed</option><option value="boys">Boys</option><option value="girls">Girls</option></select></label>
          <label>Warden<select value={buildingForm.warden_user_id} onChange={e => setBuildingForm({ ...buildingForm, warden_user_id: e.target.value })}><option value="">No warden</option>{staff.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Status<select value={buildingForm.status} onChange={e => setBuildingForm({ ...buildingForm, status: e.target.value })}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label>
          <label className="wide">Address<input value={buildingForm.address} onChange={e => setBuildingForm({ ...buildingForm, address: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Save building</button>
      </form>

      <form className="editor-card" onSubmit={saveRoom}>
        <div className="editor-heading"><Bed/><div><h3>Add room</h3><p>Set room capacity, fee and maintenance state.</p></div></div>
        <div className="field-grid three">
          <label>Building *<select required value={roomForm.building_id} onChange={e => setRoomForm({ ...roomForm, building_id: e.target.value })}><option value="">Select building</option>{buildings.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Room number *<input required value={roomForm.room_no} onChange={e => setRoomForm({ ...roomForm, room_no: e.target.value })}/></label>
          <label>Floor<input value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })}/></label>
          <label>Capacity *<input required type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })}/></label>
          <label>Monthly fee<input type="number" min="0" step="0.01" value={roomForm.monthly_fee} onChange={e => setRoomForm({ ...roomForm, monthly_fee: e.target.value })}/></label>
          <label>Status<select value={roomForm.status} onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label>
          <label className="wide">Notes<input value={roomForm.notes} onChange={e => setRoomForm({ ...roomForm, notes: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Add room</button>
      </form>
    </div>

    <div className="hostel-editor-grid">
      <form className="editor-card" onSubmit={saveBed}>
        <div className="editor-heading"><Bed/><div><h3>Add bed</h3><p>Create individual beds inside an active room.</p></div></div>
        <div className="field-grid three">
          <label>Room *<select required value={bedForm.room_id} onChange={e => setBedForm({ ...bedForm, room_id: e.target.value })}><option value="">Select room</option>{rooms.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.building_name} / {item.room_no}</option>)}</select></label>
          <label>Bed number *<input required value={bedForm.bed_no} onChange={e => setBedForm({ ...bedForm, bed_no: e.target.value })}/></label>
          <label>Status<select value={bedForm.status} onChange={e => setBedForm({ ...bedForm, status: e.target.value })}><option value="available">Available</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Add bed</button>
      </form>

      <form className="editor-card" onSubmit={saveAllocation}>
        <div className="editor-heading"><UsersRound/><div><h3>Allocate student</h3><p>Assign one available bed to one active student.</p></div></div>
        <div className="field-grid three">
          <label>Student *<select required value={allocationForm.student_id} onChange={e => setAllocationForm({ ...allocationForm, student_id: e.target.value })}><option value="">Select student</option>{students.map(item => <option key={item.id} value={item.id}>{item.first_name} {item.last_name || ''} / {item.admission_no}</option>)}</select></label>
          <label>Bed *<select required value={allocationForm.bed_id} onChange={e => setAllocationForm({ ...allocationForm, bed_id: e.target.value })}><option value="">Select bed</option>{activeBeds.map(item => <option key={item.id} value={item.id}>{item.building_name} / {item.room_no} / {item.bed_no}</option>)}</select></label>
          <label>Start date<input type="date" value={allocationForm.start_date} onChange={e => setAllocationForm({ ...allocationForm, start_date: e.target.value })}/></label>
          <label>Guardian contact<input value={allocationForm.guardian_contact} onChange={e => setAllocationForm({ ...allocationForm, guardian_contact: phoneValue(e.target.value) })}/></label>
          <label>Emergency contact<input value={allocationForm.emergency_contact} onChange={e => setAllocationForm({ ...allocationForm, emergency_contact: phoneValue(e.target.value) })}/></label>
          <label className="wide">Notes<input value={allocationForm.notes} onChange={e => setAllocationForm({ ...allocationForm, notes: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><UserRound size={16}/>Allocate bed</button>
      </form>
    </div>

    <section className="data-panel">
      <div className="panel-title"><div><span>Hostel map</span><h2>Buildings, rooms and beds</h2></div><button className="refresh-button" onClick={load} disabled={busy}><RefreshCw/>Refresh</button></div>
      <div className="hostel-building-list">{buildings.map(building => <article key={building.id}>
        <div className="route-line"><Building2/><div><b>{building.name}</b><small>{building.code || 'No code'} / {building.gender} / {building.warden_name || 'No warden'}</small></div><span className={`delivery-status ${building.status}`}>{building.status}</span></div>
        <div className="hostel-room-grid">{rooms.filter(room => room.building_id === building.id).map(room => <span key={room.id}><b>{room.room_no}</b><small>{room.occupied_count || 0}/{room.bed_count || 0} occupied</small><em>{room.status}</em></span>)}</div>
      </article>)}</div>
      {buildings.length === 0 && <div className="empty-state"><Building2/><h3>No hostel building found</h3><p>Premium schools can start by adding a hostel building.</p></div>}
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Residents</span><h2>Active hostel allocations</h2></div><b>{residents.length} students</b></div>
      <div className="table-wrap hostel-table"><table><thead><tr><th>Student</th><th>Room</th><th>Bed</th><th>Contacts</th><th>Start</th><th>Status</th><th>Action</th></tr></thead><tbody>{allocations.map(item => <tr key={item.id}><td><b>{item.student_name}</b><small>{item.admission_no} / {item.class_name} {item.section}</small></td><td>{item.building_name}<small>{item.room_no}</small></td><td>{item.bed_no}</td><td>{item.guardian_contact || '-'}<small>{item.emergency_contact || ''}</small></td><td>{item.start_date}</td><td><span className={`delivery-status ${item.status}`}>{item.status}</span></td><td>{item.status === 'active' && <button className="refresh-button danger" onClick={() => releaseAllocation(item)}><LogOut/>Release</button>}</td></tr>)}</tbody></table></div>
    </section>

    <div className="hostel-editor-grid">
      <form className="editor-card" onSubmit={saveAttendance}>
        <div className="editor-heading"><ClipboardCheck/><div><h3>Hostel attendance</h3><p>Mark resident presence for each hostel period.</p></div></div>
        <div className="field-grid three">
          <label>Resident *<select required value={attendanceForm.student_id} onChange={e => setAttendanceForm({ ...attendanceForm, student_id: e.target.value })}><option value="">Select resident</option>{residents.map(item => <option key={item.student_id} value={item.student_id}>{item.student_name}</option>)}</select></label>
          <label>Date<input type="date" value={attendanceForm.attendance_date} onChange={e => setAttendanceForm({ ...attendanceForm, attendance_date: e.target.value })}/></label>
          <label>Period<select value={attendanceForm.meal_period} onChange={e => setAttendanceForm({ ...attendanceForm, meal_period: e.target.value })}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="night">Night</option></select></label>
          <label>Status<select value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}><option value="present">Present</option><option value="absent">Absent</option><option value="leave">Leave</option></select></label>
          <label className="wide">Remarks<input value={attendanceForm.remarks} onChange={e => setAttendanceForm({ ...attendanceForm, remarks: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Save attendance</button>
      </form>

      <form className="editor-card" onSubmit={saveVisitor}>
        <div className="editor-heading"><UserRound/><div><h3>Visitor check-in</h3><p>Record guardians or approved guests visiting residents.</p></div></div>
        <div className="field-grid three">
          <label>Resident *<select required value={visitorForm.student_id} onChange={e => setVisitorForm({ ...visitorForm, student_id: e.target.value })}><option value="">Select resident</option>{residents.map(item => <option key={item.student_id} value={item.student_id}>{item.student_name}</option>)}</select></label>
          <label>Visitor name *<input required value={visitorForm.visitor_name} onChange={e => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })}/></label>
          <label>Relation<input value={visitorForm.relation} onChange={e => setVisitorForm({ ...visitorForm, relation: e.target.value })}/></label>
          <label>Mobile<input value={visitorForm.mobile} onChange={e => setVisitorForm({ ...visitorForm, mobile: phoneValue(e.target.value) })}/></label>
          <label className="wide">Purpose<input value={visitorForm.purpose} onChange={e => setVisitorForm({ ...visitorForm, purpose: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Check in visitor</button>
      </form>
    </div>

    <section className="data-panel">
      <div className="panel-title"><div><span>Daily register</span><h2>Attendance and visitors</h2></div><b>{attendance.length} attendance marks</b></div>
      <div className="table-wrap hostel-table"><table><thead><tr><th>Student</th><th>Date</th><th>Period</th><th>Status</th><th>Remarks</th></tr></thead><tbody>{attendance.map(item => <tr key={item.id}><td><b>{item.student_name}</b><small>{item.admission_no}</small></td><td>{item.attendance_date}</td><td>{item.meal_period}</td><td><span className={`delivery-status ${item.status}`}>{item.status}</span></td><td>{item.remarks || '-'}</td></tr>)}</tbody></table></div>
      <div className="table-wrap hostel-table"><table><thead><tr><th>Visitor</th><th>Student</th><th>Purpose</th><th>Check in</th><th>Status</th><th>Action</th></tr></thead><tbody>{visitors.map(item => <tr key={item.id}><td><b>{item.visitor_name}</b><small>{item.relation || '-'} / {item.mobile || '-'}</small></td><td>{item.student_name}<small>{item.admission_no}</small></td><td>{item.purpose || '-'}</td><td>{item.check_in_at ? new Date(item.check_in_at).toLocaleString() : '-'}</td><td><span className={`delivery-status ${item.status}`}>{item.status}</span></td><td>{item.status === 'checked_in' && <button className="refresh-button" onClick={() => checkoutVisitor(item)}>Check out</button>}</td></tr>)}</tbody></table></div>
    </section>
  </div>
}
