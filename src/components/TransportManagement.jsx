import { Bus, MapPin, Navigation, Plus, RefreshCw, Route, Save, Trash2, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const today = new Date().toISOString().slice(0, 10)
const phoneValue = value => {
  const digits = String(value || '').replace(/\D/g, '')
  const normalized = digits.startsWith('91') ? digits.slice(0, 12) : `91${digits.slice(0, 10)}`
  return normalized.length <= 2 ? '+91' : `+${normalized}`
}
const phoneOk = value => /^\+91[6-9]\d{9}$/.test(value || '')
const emptyVehicle = { vehicle_no: '', registration_no: '', vehicle_type: 'bus', capacity: 40, driver_name: '', driver_mobile: '+91', driver_license: '', helper_name: '', helper_mobile: '+91', status: 'active' }
const emptyRoute = { name: '', route_code: '', vehicle_id: '', direction: 'both', start_time: '', end_time: '', status: 'active' }
const emptyStop = { route_id: '', stop_name: '', stop_order: 1, pickup_time: '', drop_time: '', latitude: '', longitude: '' }
const emptyAssignment = { student_id: '', route_id: '', stop_id: '', pickup_required: true, drop_required: true, start_date: today, end_date: '', notes: '' }
const emptyLocation = { vehicle_id: '', latitude: '', longitude: '', speed_kmph: '', heading: '' }

export default function TransportManagement({ user }) {
  const canManage = user?.role === 'School Admin'
  const [vehicles, setVehicles] = useState([])
  const [routes, setRoutes] = useState([])
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [locations, setLocations] = useState([])
  const [summary, setSummary] = useState({})
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [routeForm, setRouteForm] = useState(emptyRoute)
  const [stopForm, setStopForm] = useState(emptyStop)
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignment)
  const [locationForm, setLocationForm] = useState(emptyLocation)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [editingRoute, setEditingRoute] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedRoute = useMemo(() => routes.find(routeItem => String(routeItem.id) === String(assignmentForm.route_id)), [routes, assignmentForm.route_id])
  const routeStops = selectedRoute?.stops || []

  async function load() {
    setBusy(true)
    setError('')
    try {
      const [vehicleData, routeData, assignmentData, summaryData, locationData, studentData] = await Promise.all([
        schoolApi.transportVehicles(),
        schoolApi.transportRoutes(),
        schoolApi.transportAssignments(),
        schoolApi.transportSummary(),
        schoolApi.transportLocations(),
        schoolApi.students(),
      ])
      setVehicles(vehicleData.data || [])
      setRoutes(routeData.data || [])
      setAssignments(assignmentData.data || [])
      setSummary(summaryData.summary || {})
      setLocations(locationData.data || [])
      setStudents((studentData.students || studentData.data || []).filter(item => item.status === 'active'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [])
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const [locationData, summaryData] = await Promise.all([schoolApi.transportLocations(), schoolApi.transportSummary()])
        setLocations(locationData.data || [])
        setSummary(summaryData.summary || {})
      } catch (err) {
        setError(err.message)
      }
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  const changeVehicle = (name, value) => setVehicleForm(current => ({ ...current, [name]: value }))
  const changeRoute = (name, value) => setRouteForm(current => ({ ...current, [name]: value }))
  const changeStop = (name, value) => setStopForm(current => ({ ...current, [name]: value }))
  const changeAssignment = (name, value) => setAssignmentForm(current => ({ ...current, [name]: value, ...(name === 'route_id' ? { stop_id: '' } : {}) }))
  const changeLocation = (name, value) => setLocationForm(current => ({ ...current, [name]: value }))

  function editVehicle(item) {
    setEditingVehicle(item.id)
    setVehicleForm({ ...emptyVehicle, ...item, helper_mobile: item.helper_mobile || '+91' })
  }

  function editRoute(item) {
    setEditingRoute(item.id)
    setRouteForm({ ...emptyRoute, ...item, vehicle_id: item.vehicle_id || '' })
  }

  async function saveVehicle(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const payload = { ...vehicleForm, capacity: Number(vehicleForm.capacity) }
      const result = editingVehicle ? await schoolApi.updateTransportVehicle(editingVehicle, payload) : await schoolApi.createTransportVehicle(payload)
      setMessage(result.message)
      setVehicleForm(emptyVehicle)
      setEditingVehicle(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveRoute(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const payload = { ...routeForm, vehicle_id: routeForm.vehicle_id ? Number(routeForm.vehicle_id) : null }
      const result = editingRoute ? await schoolApi.updateTransportRoute(editingRoute, payload) : await schoolApi.createTransportRoute(payload)
      setMessage(result.message)
      setRouteForm(emptyRoute)
      setEditingRoute(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveStop(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const routeId = Number(stopForm.route_id)
      const payload = { ...stopForm, stop_order: Number(stopForm.stop_order), route_id: undefined }
      const result = await schoolApi.createTransportStop(routeId, payload)
      setMessage(result.message)
      setStopForm({ ...emptyStop, route_id: stopForm.route_id, stop_order: Number(stopForm.stop_order) + 1 })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function archiveStop(stop) {
    if (!await confirmPopup({ title: `Archive ${stop.stop_name}?`, message: 'This stop will no longer appear in active route planning.', confirmLabel: 'Archive stop', tone: 'danger' })) return
    setBusy(true)
    try {
      const result = await schoolApi.deleteTransportStop(stop.id)
      setMessage(result.message)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveAssignment(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await schoolApi.createTransportAssignment({
        ...assignmentForm,
        student_id: Number(assignmentForm.student_id),
        route_id: Number(assignmentForm.route_id),
        stop_id: assignmentForm.stop_id ? Number(assignmentForm.stop_id) : null,
      })
      setMessage(result.message)
      setAssignmentForm(emptyAssignment)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function archiveAssignment(item) {
    if (!await confirmPopup({ title: `Remove ${item.student_name}?`, message: 'This will archive the active transport assignment.', confirmLabel: 'Remove assignment', tone: 'danger' })) return
    setBusy(true)
    try {
      const result = await schoolApi.deleteTransportAssignment(item.id)
      setMessage(result.message)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveLocation(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await schoolApi.updateTransportLocation(locationForm.vehicle_id, locationForm)
      setMessage(result.message)
      setLocationForm(emptyLocation)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="transport-management">
    <div className="stat-grid compact">{[
      ['Vehicles', summary.active_vehicles || 0],
      ['Routes', summary.active_routes || 0],
      ['Stops', summary.active_stops || 0],
      ['Students', summary.assigned_students || 0],
      ['Live pings', summary.recent_locations || 0],
    ].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span>transport</span></article>)}</div>
    {error && <div className="form-error">{error}</div>}
    {message && <div className="success-notice">{message}</div>}

    {canManage && <div className="transport-editor-grid">
      <form className="editor-card" onSubmit={saveVehicle}>
        <div className="editor-heading"><Bus/><div><h3>{editingVehicle ? 'Update vehicle' : 'Add vehicle and driver'}</h3><p>Register bus details, driver contact and helper contact.</p></div></div>
        <div className="field-grid three">
          <label>Vehicle number *<input required value={vehicleForm.vehicle_no} onChange={e => changeVehicle('vehicle_no', e.target.value)} placeholder="BUS-01"/></label>
          <label>Registration number<input value={vehicleForm.registration_no || ''} onChange={e => changeVehicle('registration_no', e.target.value)} placeholder="GJ01AB1234"/></label>
          <label>Capacity *<input required type="number" min="1" value={vehicleForm.capacity} onChange={e => changeVehicle('capacity', e.target.value)}/></label>
          <label>Vehicle type<select value={vehicleForm.vehicle_type} onChange={e => changeVehicle('vehicle_type', e.target.value)}><option value="bus">Bus</option><option value="van">Van</option><option value="auto">Auto</option></select></label>
          <label>Driver name *<input required value={vehicleForm.driver_name} onChange={e => changeVehicle('driver_name', e.target.value)}/></label>
          <label>Driver mobile *<input required value={vehicleForm.driver_mobile} onChange={e => changeVehicle('driver_mobile', phoneValue(e.target.value))}/></label>
          <label>Driver license<input value={vehicleForm.driver_license || ''} onChange={e => changeVehicle('driver_license', e.target.value)}/></label>
          <label>Helper name<input value={vehicleForm.helper_name || ''} onChange={e => changeVehicle('helper_name', e.target.value)}/></label>
          <label>Helper mobile<input value={vehicleForm.helper_mobile || ''} onChange={e => changeVehicle('helper_mobile', phoneValue(e.target.value))}/></label>
          <label>Status<select value={vehicleForm.status} onChange={e => changeVehicle('status', e.target.value)}><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></label>
        </div>
        {vehicleForm.driver_mobile && vehicleForm.driver_mobile !== '+91' && !phoneOk(vehicleForm.driver_mobile) && <div className="form-error">Enter a valid Indian driver mobile number.</div>}
        {vehicleForm.helper_mobile && vehicleForm.helper_mobile !== '+91' && !phoneOk(vehicleForm.helper_mobile) && <div className="form-error">Enter a valid Indian helper mobile number.</div>}
        <div className="student-row-actions"><button className="button button-small" disabled={busy}><Save size={16}/>{busy ? 'Saving...' : editingVehicle ? 'Update vehicle' : 'Add vehicle'}</button>{editingVehicle && <button type="button" onClick={() => { setEditingVehicle(null); setVehicleForm(emptyVehicle) }}>Cancel</button>}</div>
      </form>

      <form className="editor-card" onSubmit={saveRoute}>
        <div className="editor-heading"><Route/><div><h3>{editingRoute ? 'Update route' : 'Create route'}</h3><p>Connect routes with vehicles and planned timings.</p></div></div>
        <div className="field-grid three">
          <label>Route name *<input required value={routeForm.name} onChange={e => changeRoute('name', e.target.value)} placeholder="North City Route"/></label>
          <label>Route code<input value={routeForm.route_code || ''} onChange={e => changeRoute('route_code', e.target.value)} placeholder="NORTH-01"/></label>
          <label>Vehicle<select value={routeForm.vehicle_id || ''} onChange={e => changeRoute('vehicle_id', e.target.value)}><option value="">No vehicle</option>{vehicles.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.vehicle_no} / {item.driver_name}</option>)}</select></label>
          <label>Direction<select value={routeForm.direction} onChange={e => changeRoute('direction', e.target.value)}><option value="both">Pickup and drop</option><option value="pickup">Pickup only</option><option value="drop">Drop only</option></select></label>
          <label>Start time<input type="time" value={routeForm.start_time || ''} onChange={e => changeRoute('start_time', e.target.value)}/></label>
          <label>End time<input type="time" value={routeForm.end_time || ''} onChange={e => changeRoute('end_time', e.target.value)}/></label>
          <label>Status<select value={routeForm.status} onChange={e => changeRoute('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <div className="student-row-actions"><button className="button button-small" disabled={busy}><Save size={16}/>{busy ? 'Saving...' : editingRoute ? 'Update route' : 'Create route'}</button>{editingRoute && <button type="button" onClick={() => { setEditingRoute(null); setRouteForm(emptyRoute) }}>Cancel</button>}</div>
      </form>
    </div>}

    {canManage && <div className="transport-editor-grid">
      <form className="editor-card" onSubmit={saveStop}>
        <div className="editor-heading"><MapPin/><div><h3>Add route stop</h3><p>Build each route with ordered stops and optional GPS points.</p></div></div>
        <div className="field-grid three">
          <label>Route *<select required value={stopForm.route_id} onChange={e => changeStop('route_id', e.target.value)}><option value="">Select route</option>{routes.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Stop name *<input required value={stopForm.stop_name} onChange={e => changeStop('stop_name', e.target.value)} placeholder="Main Gate"/></label>
          <label>Stop order *<input required type="number" min="1" value={stopForm.stop_order} onChange={e => changeStop('stop_order', e.target.value)}/></label>
          <label>Pickup time<input type="time" value={stopForm.pickup_time} onChange={e => changeStop('pickup_time', e.target.value)}/></label>
          <label>Drop time<input type="time" value={stopForm.drop_time} onChange={e => changeStop('drop_time', e.target.value)}/></label>
          <label>Latitude<input type="number" step="0.0000001" value={stopForm.latitude} onChange={e => changeStop('latitude', e.target.value)}/></label>
          <label>Longitude<input type="number" step="0.0000001" value={stopForm.longitude} onChange={e => changeStop('longitude', e.target.value)}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Add stop</button>
      </form>

      <form className="editor-card" onSubmit={saveAssignment}>
        <div className="editor-heading"><UsersRound/><div><h3>Assign student</h3><p>Attach a student to one active route and stop.</p></div></div>
        <div className="field-grid three">
          <label>Student *<select required value={assignmentForm.student_id} onChange={e => changeAssignment('student_id', e.target.value)}><option value="">Select student</option>{students.map(item => <option key={item.id} value={item.id}>{item.first_name} {item.last_name || ''} / {item.admission_no}</option>)}</select></label>
          <label>Route *<select required value={assignmentForm.route_id} onChange={e => changeAssignment('route_id', e.target.value)}><option value="">Select route</option>{routes.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Stop<select value={assignmentForm.stop_id} onChange={e => changeAssignment('stop_id', e.target.value)}><option value="">No stop</option>{routeStops.map(item => <option key={item.id} value={item.id}>{item.stop_order}. {item.stop_name}</option>)}</select></label>
          <label>Start date *<input required type="date" value={assignmentForm.start_date} onChange={e => changeAssignment('start_date', e.target.value)}/></label>
          <label>End date<input type="date" value={assignmentForm.end_date} onChange={e => changeAssignment('end_date', e.target.value)}/></label>
          <label className="transport-check"><input type="checkbox" checked={assignmentForm.pickup_required} onChange={e => changeAssignment('pickup_required', e.target.checked)}/> Pickup</label>
          <label className="transport-check"><input type="checkbox" checked={assignmentForm.drop_required} onChange={e => changeAssignment('drop_required', e.target.checked)}/> Drop</label>
          <label className="wide">Notes<input value={assignmentForm.notes} onChange={e => changeAssignment('notes', e.target.value)}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Assign student</button>
      </form>
    </div>}

    <section className="data-panel">
      <div className="panel-title"><div><span>Fleet</span><h2>Vehicles and drivers</h2></div><button className="refresh-button" onClick={load} disabled={busy}><RefreshCw/>Refresh</button></div>
      <div className="transport-card-grid">{vehicles.map(item => <article key={item.id}>
        <Bus/><div><b>{item.vehicle_no}</b><small>{item.registration_no || 'No registration'} / {item.vehicle_type}</small><p>{item.driver_name} / {item.driver_mobile}</p><p>{item.assigned_students || 0} students / {item.active_routes || 0} routes</p></div>
        <span className={`delivery-status ${item.status}`}>{item.status}</span>{canManage && <button onClick={() => editVehicle(item)}>Edit</button>}
      </article>)}</div>
      {vehicles.length === 0 && <div className="empty-state"><Bus/><h3>No vehicles found</h3><p>Add the first school transport vehicle.</p></div>}
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Route planning</span><h2>Routes and stops</h2></div><b>{routes.length} routes</b></div>
      <div className="transport-route-list">{routes.map(item => <article key={item.id}>
        <div className="route-line"><Route/><div><b>{item.name}</b><small>{item.route_code || 'No code'} / {item.vehicle_no || 'No vehicle'} / {item.direction}</small></div><span className={`delivery-status ${item.status}`}>{item.status}</span>{canManage && <button onClick={() => editRoute(item)}>Edit</button>}</div>
        <div className="stop-list">{(item.stops || []).map(stop => <span key={stop.id}><b>{stop.stop_order}</b>{stop.stop_name}<small>{stop.pickup_time || '-'} / {stop.drop_time || '-'}</small>{canManage && <button onClick={() => archiveStop(stop)} title="Archive stop"><Trash2/></button>}</span>)}</div>
      </article>)}</div>
      {routes.length === 0 && <div className="empty-state"><Route/><h3>No routes found</h3><p>Create a route, then add stops.</p></div>}
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Student transport</span><h2>Route assignments</h2></div><b>{assignments.length} records</b></div>
      <div className="table-wrap transport-table"><table><thead><tr><th>Student</th><th>Route</th><th>Stop</th><th>Vehicle</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead><tbody>{assignments.map(item => <tr key={item.id}><td><b>{item.student_name}</b><small>{item.admission_no} / {item.class_name} {item.section}</small></td><td>{item.route_name}<small>{item.route_code || 'No code'}</small></td><td>{item.stop_name || '-'}</td><td>{item.vehicle_no || '-'}<small>{item.driver_name || ''}</small></td><td>{item.start_date}<small>{item.end_date || 'Active'}</small></td><td><span className={`delivery-status ${item.status}`}>{item.status}</span></td><td>{canManage && item.status === 'active' && <button className="refresh-button danger" onClick={() => archiveAssignment(item)}><Trash2/>Remove</button>}</td></tr>)}</tbody></table></div>
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Live tracking</span><h2>Latest vehicle locations</h2></div><b>{locations.length} vehicles</b></div>
      {canManage && <form className="transport-location-form" onSubmit={saveLocation}>
        <label>Vehicle *<select required value={locationForm.vehicle_id} onChange={e => changeLocation('vehicle_id', e.target.value)}><option value="">Select vehicle</option>{vehicles.map(item => <option key={item.id} value={item.id}>{item.vehicle_no}</option>)}</select></label>
        <label>Latitude *<input required type="number" step="0.0000001" value={locationForm.latitude} onChange={e => changeLocation('latitude', e.target.value)}/></label>
        <label>Longitude *<input required type="number" step="0.0000001" value={locationForm.longitude} onChange={e => changeLocation('longitude', e.target.value)}/></label>
        <label>Speed<input type="number" step="0.01" value={locationForm.speed_kmph} onChange={e => changeLocation('speed_kmph', e.target.value)}/></label>
        <label>Heading<input value={locationForm.heading} onChange={e => changeLocation('heading', e.target.value)} placeholder="North"/></label>
        <button className="button button-small" disabled={busy}><Navigation size={16}/>Update location</button>
      </form>}
      <div className="table-wrap transport-table"><table><thead><tr><th>Vehicle</th><th>Route</th><th>Driver</th><th>Coordinates</th><th>Speed</th><th>Reported</th></tr></thead><tbody>{locations.map(item => <tr key={`${item.vehicle_id}-${item.route_name || 'route'}`}><td><b>{item.vehicle_no}</b></td><td>{item.route_name || '-'}</td><td>{item.driver_name}<small>{item.driver_mobile}</small></td><td>{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'No ping yet'}</td><td>{item.speed_kmph ? `${item.speed_kmph} km/h` : '-'}</td><td>{item.reported_at ? new Date(item.reported_at).toLocaleString() : '-'}</td></tr>)}</tbody></table></div>
    </section>
  </div>
}
