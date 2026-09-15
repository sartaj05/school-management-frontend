import { CheckCircle2, ClipboardList, Plus, Save, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'

const today = new Date().toISOString().slice(0, 10)
const emptySupplier = { name: '', contact_person: '', mobile: '+91', email: '', gst_number: '', address: '' }
const emptyOrder = { po_number: `PO-${today.replaceAll('-', '')}`, supplier_id: '', order_date: today, expected_date: '', notes: '' }
const emptyLine = { item_id: '', quantity: 1, unit_cost: 0, tax_rate: 0, notes: '' }

const phoneValue = value => {
  const digits = String(value || '').replace(/\D/g, '')
  const normalized = digits.startsWith('91') ? digits.slice(0, 12) : `91${digits.slice(0, 10)}`
  return normalized.length <= 2 ? '+91' : `+${normalized}`
}

export default function InventoryPurchaseManagement() {
  const [summary, setSummary] = useState({})
  const [suppliers, setSuppliers] = useState([])
  const [items, setItems] = useState([])
  const [orders, setOrders] = useState([])
  const [supplierForm, setSupplierForm] = useState(emptySupplier)
  const [orderForm, setOrderForm] = useState(emptyOrder)
  const [lines, setLines] = useState([{ ...emptyLine }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const openOrders = useMemo(() => orders.filter(item => !['received', 'cancelled', 'rejected'].includes(item.status)), [orders])

  async function load() {
    setBusy(true); setError('')
    try {
      const [summaryData, supplierData, itemData, orderData] = await Promise.all([
        schoolApi.inventoryPurchaseSummary(),
        schoolApi.inventorySuppliers(),
        schoolApi.inventoryItems({ limit: 100, offset: 0, search: '', low_stock: 'false' }),
        schoolApi.inventoryPurchaseOrders({ limit: 25, offset: 0, status: 'all' }),
      ])
      setSummary(summaryData.data || {})
      setSuppliers(supplierData.data || [])
      setItems(itemData.data || [])
      setOrders(orderData.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [])

  async function saveSupplier(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createInventorySupplier(supplierForm)
      setMessage(result.message); setSupplierForm(emptySupplier); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveOrder(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const cleanLines = lines.map(line => ({ ...line, item_id: Number(line.item_id), quantity: Number(line.quantity), unit_cost: Number(line.unit_cost), tax_rate: Number(line.tax_rate || 0) }))
      const result = await schoolApi.createInventoryPurchaseOrder({ ...orderForm, items: cleanLines })
      setMessage(result.message); setOrderForm({ ...emptyOrder, po_number: `PO-${Date.now()}` }); setLines([{ ...emptyLine }]); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function changeStatus(order, status) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.updateInventoryPurchaseOrderStatus(order.id, { status })
      setMessage(result.message); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function receiveLine(order, line) {
    const remaining = line.quantity - line.received_quantity
    if (remaining < 1) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.receiveInventoryPurchaseOrder(order.id, { line_id: line.id, quantity: remaining, reference: order.po_number, notes: `Received against ${order.po_number}` })
      setMessage(result.message); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  function updateLine(index, key, value) {
    setLines(current => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line))
  }

  return <section className="purchase-management">
    <div className="panel-title"><div><span>Premium purchasing</span><h2>Purchase orders and suppliers</h2></div><button className="refresh-button" onClick={load} disabled={busy}>Refresh</button></div>
    {error && <div className="form-error">{error}</div>}
    {message && <div className="success-notice">{message}</div>}
    <div className="stat-grid compact purchase-stats">{[
      ['Suppliers', summary.suppliers || 0],
      ['Open orders', summary.open_orders || 0],
      ['Committed', summary.committed_amount || 0],
      ['Received', summary.received_orders || 0],
    ].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span>purchase</span></article>)}</div>

    <div className="purchase-editor-grid">
      <form className="editor-card" onSubmit={saveSupplier}>
        <div className="editor-heading"><Truck/><div><h3>Add supplier</h3><p>Register vendors before creating purchase orders.</p></div></div>
        <div className="field-grid three">
          <label>Name *<input required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}/></label>
          <label>Contact person<input value={supplierForm.contact_person} onChange={e => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}/></label>
          <label>Mobile<input value={supplierForm.mobile} onChange={e => setSupplierForm({ ...supplierForm, mobile: phoneValue(e.target.value) })}/></label>
          <label>Email<input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}/></label>
          <label>GST number<input value={supplierForm.gst_number} onChange={e => setSupplierForm({ ...supplierForm, gst_number: e.target.value })}/></label>
          <label className="wide">Address<input value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Save supplier</button>
      </form>

      <form className="editor-card" onSubmit={saveOrder}>
        <div className="editor-heading"><ClipboardList/><div><h3>Create purchase order</h3><p>Add one or more inventory items for approval and receiving.</p></div></div>
        <div className="field-grid three">
          <label>PO number *<input required value={orderForm.po_number} onChange={e => setOrderForm({ ...orderForm, po_number: e.target.value })}/></label>
          <label>Supplier *<select required value={orderForm.supplier_id} onChange={e => setOrderForm({ ...orderForm, supplier_id: e.target.value })}><option value="">Select supplier</option>{suppliers.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Order date<input type="date" value={orderForm.order_date} onChange={e => setOrderForm({ ...orderForm, order_date: e.target.value })}/></label>
          <label>Expected date<input type="date" value={orderForm.expected_date} onChange={e => setOrderForm({ ...orderForm, expected_date: e.target.value })}/></label>
          <label className="wide">Notes<input value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}/></label>
        </div>
        <div className="purchase-lines">{lines.map((line, index) => <article key={index}>
          <label>Item<select required value={line.item_id} onChange={e => updateLine(index, 'item_id', e.target.value)}><option value="">Select item</option>{items.map(item => <option key={item.id} value={item.id}>{item.code} / {item.name}</option>)}</select></label>
          <label>Qty<input required type="number" min="1" value={line.quantity} onChange={e => updateLine(index, 'quantity', e.target.value)}/></label>
          <label>Unit cost<input required type="number" min="0" step="0.01" value={line.unit_cost} onChange={e => updateLine(index, 'unit_cost', e.target.value)}/></label>
          <label>Tax %<input type="number" min="0" max="100" step="0.01" value={line.tax_rate} onChange={e => updateLine(index, 'tax_rate', e.target.value)}/></label>
          <label>Note<input value={line.notes} onChange={e => updateLine(index, 'notes', e.target.value)}/></label>
        </article>)}</div>
        <div className="student-row-actions"><button type="button" onClick={() => setLines([...lines, { ...emptyLine }])}><Plus size={15}/>Line</button><button className="button button-small" disabled={busy}><Save size={16}/>Create PO</button></div>
      </form>
    </div>

    <div className="table-wrap purchase-table"><table><thead><tr><th>PO</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Items</th><th>Workflow</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}>
      <td><b>{order.po_number}</b><small>{order.order_date} / expected {order.expected_date || '-'}</small></td>
      <td>{order.supplier_name}<small>Created by {order.created_by_name || '-'}</small></td>
      <td>{order.total_amount}<small>Tax {order.tax_amount}</small></td>
      <td><span className={`delivery-status ${order.status}`}>{order.status}</span></td>
      <td>{(order.items || []).map(line => <span className="purchase-line-pill" key={line.id}>{line.code}: {line.received_quantity}/{line.quantity}</span>)}</td>
      <td><div className="purchase-actions">
        {order.status === 'draft' && <button onClick={() => changeStatus(order, 'submitted')}>Submit</button>}
        {order.status === 'submitted' && <><button onClick={() => changeStatus(order, 'approved')}>Approve</button><button onClick={() => changeStatus(order, 'rejected')}>Reject</button></>}
        {order.status === 'approved' && <button onClick={() => changeStatus(order, 'ordered')}>Mark ordered</button>}
        {['ordered', 'partially_received'].includes(order.status) && (order.items || []).map(line => line.received_quantity < line.quantity && <button key={line.id} onClick={() => receiveLine(order, line)}><CheckCircle2/>Receive {line.code}</button>)}
        {openOrders.includes(order) && <button onClick={() => changeStatus(order, 'cancelled')}>Cancel</button>}
      </div></td>
    </tr>)}{!orders.length && <tr><td colSpan="6">No purchase orders yet.</td></tr>}</tbody></table></div>
  </section>
}
