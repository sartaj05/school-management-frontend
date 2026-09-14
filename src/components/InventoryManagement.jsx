import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

function Field({ label, name, type = 'text', required = true, ...props }) {
  return <label>{label}<input name={name} type={type} required={required} {...props} /></label>
}

function Note({ label = 'Reason / notes', name = 'notes' }) {
  return <label className="wide">{label}<textarea name={name} required maxLength="2000" /></label>
}

function Form({ title, children, onSave, busy, button = 'Save' }) {
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    if (await onSave(values)) form.reset()
  }
  return <form className="editor-card" onSubmit={submit}><h3>{title}</h3><fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}><div className="field-grid">{children}</div><button className="button button-small">{busy ? 'Saving...' : button}</button></fieldset></form>
}

function Category({ categories, defaultValue = '' }) {
  return <label>Category<select name="category_id" required defaultValue={defaultValue}><option value="">Select category</option>{categories.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
}

function Pager({ offset, total, onChange, disabled }) {
  return <div className="page-actions"><button disabled={disabled || offset === 0} onClick={() => onChange(Math.max(0, offset - 25))}>Previous</button><span>Page {Math.floor(offset / 25) + 1} · {total} records</span><button disabled={disabled || offset + 25 >= total} onClick={() => onChange(offset + 25)}>Next</button></div>
}

export default function InventoryManagement() {
  const [options, setOptions] = useState({ categories: [], rooms: [], staff: [] })
  const [summary, setSummary] = useState({})
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [low, setLow] = useState(false)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [create, setCreate] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const [o, s, items] = await Promise.all([schoolApi.inventoryOptions(), schoolApi.inventorySummary(), schoolApi.inventoryItems({ search, low_stock: String(low), limit: 25, offset })])
        if (active) { setOptions(o); setSummary(s.data); setRows(items.data); setTotal(items.total) }
      } catch (err) { if (active) { setError(err.message); setRows([]) } }
      finally { if (active) setLoading(false) }
    }, 150)
    return () => { active = false; clearTimeout(timer) }
  }, [search, low, offset, refresh])

  async function mutate(action) {
    setBusy(true); setError(''); setNotice('')
    try { const result = await action(); setNotice(result.message); setRefresh(value => value + 1); return true }
    catch (err) { setError(err.message); return false }
    finally { setBusy(false) }
  }

  return <>
    <section className="people-hero"><div><span>School operations</span><h2>Inventory and assets</h2><p>Track stock, custody, returns and maintenance across your school.</p></div><Package /></section>
    {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="success-notice" role="status">{notice}</div>}
    <div className="page-actions"><b>{summary.items || 0} items</b><button onClick={() => { setLow(true); setOffset(0) }}>{summary.low_stock_items || 0} low-stock alerts</button><span>{summary.outstanding_assignments || 0} outstanding assignments</span><span>{summary.open_maintenance || 0} open maintenance · {summary.overdue_maintenance || 0} overdue</span></div>
    <div className="page-actions"><label>Search items<input value={search} maxLength="180" onChange={e => { setSearch(e.target.value); setOffset(0) }} placeholder="Name or code" /></label><label><input type="checkbox" checked={low} onChange={e => { setLow(e.target.checked); setOffset(0) }} /> Low stock only</label><button className="button button-small" disabled={busy} onClick={() => setCreate(value => !value)}>{create ? 'Close setup' : 'Add items / categories / rooms'}</button><button disabled={busy || loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
    {create && <>
      <Form title="Add category" busy={busy} onSave={values => mutate(() => schoolApi.createInventoryCategory(values))}><Field label="Category name" name="name" maxLength="120" /></Form>
      <Form title="Add room" busy={busy} onSave={values => mutate(() => schoolApi.createInventoryRoom(values))}><Field label="Room name / number" name="name" maxLength="120" /></Form>
      <Form title="Add stock item" busy={busy} button="Create item" onSave={values => mutate(() => schoolApi.createInventoryItem(values))}>
        <Field label="Unique code / asset tag" name="code" maxLength="60" /><Field label="Item name" name="name" maxLength="180" /><Category categories={options.categories} />
        <label>Type<select name="item_type"><option value="asset">Returnable asset</option><option value="consumable">Consumable</option></select></label>
        <Field label="Unit" name="unit" defaultValue="units" maxLength="30" /><Field label="Storage location" name="storage_location" maxLength="180" required={false} />
        <Field label="Opening quantity" name="opening_quantity" type="number" min="0" max="1000000" step="1" defaultValue="0" /><Field label="Low-stock threshold" name="minimum_stock" type="number" min="0" max="1000000" step="1" defaultValue="0" />
      </Form><p>Use quantity 1 and a unique code for an individually tagged asset. Consumables are consumed through stock write-offs.</p>
    </>}
    {loading ? <p role="status">Loading inventory...</p> : <section className="data-panel"><div className="table-wrap"><table><thead><tr><th>Code / item</th><th>Category</th><th>Total</th><th>Available</th><th>Assigned</th><th>Maintenance</th><th>Stock status</th><th>Manage</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.code}</b><br />{row.name} ({row.unit})</td><td>{row.category_name}</td><td>{row.total_quantity}</td><td>{row.available_quantity}</td><td>{row.assigned_quantity}</td><td>{row.maintenance_quantity}</td><td>{row.low_stock ? `Low stock: threshold ${row.minimum_stock}` : 'In stock'}</td><td><button disabled={busy} onClick={() => setSelected(row.id)}>Open</button></td></tr>)}{!rows.length && <tr><td colSpan="8">No items match these filters.</td></tr>}</tbody></table></div><Pager offset={offset} total={total} onChange={setOffset} disabled={busy} /></section>}
    {selected && <InventoryItem key={selected} id={selected} options={options} refresh={refresh} busy={busy} mutate={mutate} onClose={() => setSelected(null)} />}
  </>
}

function InventoryItem({ id, options, refresh, busy, mutate, onClose }) {
  const [item, setItem] = useState(null)
  const [tab, setTab] = useState('stock')
  const [kind, setKind] = useState('movements')
  const [offset, setOffset] = useState(0)
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState(null)
  const [target, setTarget] = useState('staff')
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const [detail, history] = await Promise.all([schoolApi.inventoryItem(id), schoolApi.inventoryRecords(kind, { item_id: id, limit: 25, offset })])
        if (active) { setItem(detail.data); setRecords(history.data); setTotal(history.total) }
      } catch (err) { if (active) setError(err.message) }
      finally { if (active) setLoading(false) }
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [id, refresh, kind, offset])

  async function save(actionFn) {
    const saved = await mutate(actionFn)
    if (saved) setAction(null)
    return saved
  }

  return <section className="editor-card">
    <div className="panel-title"><h2>{item ? `${item.code} — ${item.name}` : 'Item details'}</h2><button disabled={busy} onClick={onClose}>Close</button></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {item && <>
      <p>{item.available_quantity} available / {item.total_quantity} total · {item.assigned_quantity} assigned · {item.maintenance_quantity} in maintenance</p>
      <div className="page-actions">{['stock', 'details', ...(item.item_type === 'asset' ? ['assign', 'maintenance'] : [])].map(value => <button key={value} disabled={busy} className={tab === value ? 'button button-small' : ''} onClick={() => setTab(value)}>{value === 'stock' ? 'Receive / write off' : value === 'assign' ? 'Assign assets' : value === 'details' ? 'Edit details' : 'Start maintenance'}</button>)}</div>
      {tab === 'stock' && <Form title="Record stock movement" busy={busy} onSave={values => save(() => schoolApi.inventoryStock(id, values))}>
        <label>Action<select name="action"><option value="receipt">Receive stock</option><option value="write_off">Write off / consume available stock</option></select></label><Field label="Quantity" name="quantity" type="number" min="1" max="1000000" step="1" />
        <Field label="Supplier (optional)" name="supplier" maxLength="180" required={false} /><Field label="Invoice / reference (optional)" name="reference" maxLength="180" required={false} /><Field label="Unit cost (school currency)" name="unit_cost" type="number" min="0" max="9999999999.99" step="0.01" defaultValue="0" /><Note />
      </Form>}
      {tab === 'details' && <Form key={refresh} title="Edit item details" busy={busy} onSave={values => save(() => schoolApi.updateInventoryItem(id, values))}><Field label="Name" name="name" maxLength="180" defaultValue={item.name} /><Category categories={options.categories} defaultValue={item.category_id} /><Field label="Storage location" name="storage_location" maxLength="180" required={false} defaultValue={item.storage_location} /><Field label="Low-stock threshold" name="minimum_stock" type="number" min="0" max="1000000" step="1" defaultValue={item.minimum_stock} /><Note label="Change reason" /></Form>}
      {tab === 'assign' && <Form title="Assign available assets" busy={busy} onSave={values => save(() => schoolApi.assignInventoryItem(id, values))}>
        <label>Assign to<select value={target} onChange={e => setTarget(e.target.value)}><option value="staff">Staff</option><option value="room">Room</option></select></label>
        <label>{target === 'staff' ? 'Staff member' : 'Room'}<select key={target} name={target === 'staff' ? 'teacher_id' : 'room_id'} required defaultValue=""><option value="">Select</option>{options[target === 'staff' ? 'staff' : 'rooms'].map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <Field label="Quantity" name="quantity" type="number" min="1" max={item.available_quantity || 1} step="1" /><Note label="Custody / assignment note" />
      </Form>}
      {tab === 'maintenance' && <Form title="Reserve assets for maintenance" busy={busy} onSave={values => save(() => schoolApi.startInventoryMaintenance(id, values))}><Field label="Quantity" name="quantity" type="number" min="1" max={item.available_quantity || 1} step="1" /><Field label="Due date" name="due_date" type="date" /><Note name="description" label="Problem / service description" /></Form>}
      <p>Maintenance reserves available assets immediately. Return assigned assets before servicing them. A return restores available stock; reserve damaged returns for maintenance before reassigning them.</p>
    </>}
    <div className="page-actions"><h3>History and operations</h3><label>Records<select value={kind} disabled={busy} onChange={e => { setKind(e.target.value); setOffset(0); setAction(null) }}><option value="movements">Stock movement history</option><option value="assignments">Assignments and returns</option><option value="maintenance">Maintenance history</option></select></label></div>
    {loading ? <p role="status">Loading records...</p> : <>
      <div className="table-wrap"><table><thead><tr><th>Record</th><th>Quantity</th><th>Details</th><th>Date / actor</th><th>Action</th></tr></thead><tbody>{records.map(row => <tr key={row.id}>
        <td>#{row.id}<br />{kind === 'movements' ? row.action : kind === 'assignments' ? row.staff_name || row.room_name : row.status}</td><td>{row.quantity}{kind === 'assignments' && <><br />{row.returned_quantity} returned</>}{kind === 'movements' && <><br />Available after: {row.available_after}</>}</td>
        <td>{row.notes || row.description}{kind === 'movements' && <><br />Supplier: {row.supplier || '—'} · Ref: {row.reference || '—'} · Unit cost: {row.unit_cost}</>}{kind === 'maintenance' && <><br />Due: {row.due_date}{row.status === 'open' && row.due_date < new Date().toLocaleDateString('en-CA') ? ' (overdue)' : ''}<br />{row.completion_notes} · Cost: {row.cost}</>}</td>
        <td>{new Date(row.created_at || row.assigned_at).toLocaleString()}<br />User #{row.actor_id || row.assigned_by || row.created_by}</td>
        <td>{kind === 'assignments' && row.returned_quantity < row.quantity && <button disabled={busy} onClick={() => setAction({ type: 'return', row })}>Return</button>}{kind === 'maintenance' && row.status === 'open' && <button disabled={busy} onClick={() => setAction({ type: 'complete', row })}>Complete</button>}</td>
      </tr>)}{!records.length && <tr><td colSpan="5">No records yet.</td></tr>}</tbody></table></div><Pager offset={offset} total={total} onChange={setOffset} disabled={busy} />
    </>}
    {action?.type === 'return' && <Form key={`return-${action.row.id}`} title={`Return from assignment #${action.row.id}`} busy={busy} onSave={values => save(() => schoolApi.returnInventoryAssignment(action.row.id, values))}><Field label="Quantity returned" name="quantity" type="number" min="1" max={action.row.quantity - action.row.returned_quantity} step="1" /><Note label="Condition / return note" /></Form>}
    {action?.type === 'complete' && <Form key={`complete-${action.row.id}`} title={`Complete maintenance #${action.row.id}`} busy={busy} onSave={values => save(() => schoolApi.completeInventoryMaintenance(action.row.id, values))}><Field label="Total service cost (school currency)" name="cost" type="number" min="0" max="9999999999.99" step="0.01" defaultValue="0" /><Note label="Work completed / condition" /></Form>}
  </section>
}
