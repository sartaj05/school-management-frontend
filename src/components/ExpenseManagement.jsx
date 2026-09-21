import { Banknote, CheckCircle2, CreditCard, Plus, Receipt, RefreshCw, Save, Tag, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'

const today = new Date().toISOString().slice(0, 10)
const emptyVendor = { name: '', contact_person: '', mobile: '+91', email: '', gst_number: '', pan_number: '', address: '' }
const emptyCategory = { name: '', budget_amount: 0, description: '' }
const emptyBill = { bill_number: `BILL-${today.replaceAll('-', '')}`, vendor_id: '', category_id: '', bill_date: today, due_date: '', amount: '', tax_amount: 0, purpose: '' }
const emptyPayment = { bill_id: '', payment_date: today, amount: '', payment_mode: 'bank_transfer', reference_no: '', notes: '' }

const phoneValue = value => {
  const digits = String(value || '').replace(/\D/g, '')
  const normalized = digits.startsWith('91') ? digits.slice(0, 12) : `91${digits.slice(0, 10)}`
  return normalized.length <= 2 ? '+91' : `+${normalized}`
}

export default function ExpenseManagement() {
  const [summary, setSummary] = useState({})
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [vendorForm, setVendorForm] = useState(emptyVendor)
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [billForm, setBillForm] = useState(emptyBill)
  const [paymentForm, setPaymentForm] = useState(emptyPayment)
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const payableBills = useMemo(() => bills.filter(item => ['approved', 'partially_paid'].includes(item.status) && Number(item.outstanding_amount) > 0), [bills])

  async function load(selectedStatus = status) {
    setBusy(true); setError('')
    try {
      const [summaryData, vendorData, categoryData, billData, paymentData] = await Promise.all([
        schoolApi.expenseSummary(),
        schoolApi.expenseVendors(),
        schoolApi.expenseCategories(),
        schoolApi.expenseBills(selectedStatus),
        schoolApi.expensePayments(),
      ])
      setSummary(summaryData.data || {})
      setVendors(vendorData.data || [])
      setCategories(categoryData.data || [])
      setBills(billData.data || [])
      setPayments(paymentData.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Initial load uses the all-status view before the user chooses a filter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = setTimeout(() => load('all'), 0); return () => clearTimeout(timer) }, [])

  async function saveVendor(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createExpenseVendor(vendorForm)
      setMessage(result.message); setVendorForm(emptyVendor); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveCategory(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createExpenseCategory({ ...categoryForm, budget_amount: Number(categoryForm.budget_amount || 0) })
      setMessage(result.message); setCategoryForm(emptyCategory); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveBill(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createExpenseBill({ ...billForm, amount: Number(billForm.amount), tax_amount: Number(billForm.tax_amount || 0) })
      setMessage(result.message); setBillForm({ ...emptyBill, bill_number: `BILL-${Date.now()}` }); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function updateStatus(item, nextStatus) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.updateExpenseBillStatus(item.id, { status: nextStatus })
      setMessage(result.message); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function savePayment(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createExpensePayment({ ...paymentForm, amount: Number(paymentForm.amount) })
      setMessage(result.message); setPaymentForm(emptyPayment); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="expense-management">
    <section className="people-hero expense-hero"><div><span>Enterprise finance</span><h2>Expense management and vendor payments</h2><p>Track bills, approvals and outgoing payments from one accounts workspace.</p></div><Banknote/></section>
    {error && <div className="form-error">{error}</div>}
    {message && <div className="success-notice">{message}</div>}
    <div className="stat-grid compact expense-stats">{[
      ['Vendors', summary.active_vendors || 0],
      ['Approval', summary.pending_approval || 0],
      ['Payables', summary.payable_bills || 0],
      ['Due', summary.payable_amount || 0],
      ['Paid month', summary.paid_this_month || 0],
    ].map(([label, value]) => <article key={label}><small>{label}</small><b>{Number(value).toLocaleString()}</b><span>expense</span></article>)}</div>

    <div className="expense-editor-grid">
      <form className="editor-card" onSubmit={saveVendor}>
        <div className="editor-heading"><Banknote/><div><h3>Add vendor</h3><p>Register payees used by expense bills.</p></div></div>
        <div className="field-grid three">
          <label>Name *<input required value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}/></label>
          <label>Contact person<input value={vendorForm.contact_person} onChange={e => setVendorForm({ ...vendorForm, contact_person: e.target.value })}/></label>
          <label>Mobile<input value={vendorForm.mobile} onChange={e => setVendorForm({ ...vendorForm, mobile: phoneValue(e.target.value) })}/></label>
          <label>Email<input type="email" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })}/></label>
          <label>GST number<input value={vendorForm.gst_number} onChange={e => setVendorForm({ ...vendorForm, gst_number: e.target.value })}/></label>
          <label>PAN number<input value={vendorForm.pan_number} onChange={e => setVendorForm({ ...vendorForm, pan_number: e.target.value })}/></label>
          <label className="wide">Address<input value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Save vendor</button>
      </form>

      <form className="editor-card" onSubmit={saveCategory}>
        <div className="editor-heading"><Tag/><div><h3>Add category</h3><p>Organize transport, utilities, repair and administrative spend.</p></div></div>
        <div className="field-grid three">
          <label>Name *<input required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}/></label>
          <label>Budget<input type="number" min="0" step="0.01" value={categoryForm.budget_amount} onChange={e => setCategoryForm({ ...categoryForm, budget_amount: e.target.value })}/></label>
          <label className="wide">Description<input value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Save category</button>
      </form>
    </div>

    <div className="expense-editor-grid">
      <form className="editor-card" onSubmit={saveBill}>
        <div className="editor-heading"><Receipt/><div><h3>Create bill</h3><p>Submit a vendor bill before approval and payment.</p></div></div>
        <div className="field-grid three">
          <label>Bill number *<input required value={billForm.bill_number} onChange={e => setBillForm({ ...billForm, bill_number: e.target.value })}/></label>
          <label>Vendor *<select required value={billForm.vendor_id} onChange={e => setBillForm({ ...billForm, vendor_id: e.target.value })}><option value="">Select vendor</option>{vendors.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Category *<select required value={billForm.category_id} onChange={e => setBillForm({ ...billForm, category_id: e.target.value })}><option value="">Select category</option>{categories.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Bill date<input type="date" value={billForm.bill_date} onChange={e => setBillForm({ ...billForm, bill_date: e.target.value })}/></label>
          <label>Due date<input type="date" value={billForm.due_date} onChange={e => setBillForm({ ...billForm, due_date: e.target.value })}/></label>
          <label>Amount *<input required type="number" min="0.01" step="0.01" value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })}/></label>
          <label>Tax<input type="number" min="0" step="0.01" value={billForm.tax_amount} onChange={e => setBillForm({ ...billForm, tax_amount: e.target.value })}/></label>
          <label className="wide">Purpose *<input required value={billForm.purpose} onChange={e => setBillForm({ ...billForm, purpose: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Create bill</button>
      </form>

      <form className="editor-card" onSubmit={savePayment}>
        <div className="editor-heading"><CreditCard/><div><h3>Record payment</h3><p>Post payments only after a bill is approved.</p></div></div>
        <div className="field-grid three">
          <label>Bill *<select required value={paymentForm.bill_id} onChange={e => { const bill = payableBills.find(item => String(item.id) === e.target.value); setPaymentForm({ ...paymentForm, bill_id: e.target.value, amount: bill?.outstanding_amount || paymentForm.amount }) }}><option value="">Select payable bill</option>{payableBills.map(item => <option key={item.id} value={item.id}>{item.bill_number} / {item.vendor_name} / due {item.outstanding_amount}</option>)}</select></label>
          <label>Date<input type="date" value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}/></label>
          <label>Amount *<input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}/></label>
          <label>Mode<select value={paymentForm.payment_mode} onChange={e => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>{['cash','bank_transfer','upi','cheque','card','other'].map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Reference<input value={paymentForm.reference_no} onChange={e => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}/></label>
          <label className="wide">Notes<input value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Record payment</button>
      </form>
    </div>

    <section className="data-panel">
      <div className="panel-title"><div><span>Bills</span><h2>Approval and payable queue</h2></div><div className="expense-toolbar"><select value={status} onChange={e => { setStatus(e.target.value); load(e.target.value) }}>{['all','draft','submitted','approved','partially_paid','paid','rejected','cancelled'].map(item => <option key={item}>{item}</option>)}</select><button className="refresh-button" onClick={() => load(status)} disabled={busy}><RefreshCw/>Refresh</button></div></div>
      <div className="table-wrap expense-table"><table><thead><tr><th>Bill</th><th>Vendor</th><th>Category</th><th>Amount</th><th>Paid</th><th>Status</th><th>Workflow</th></tr></thead><tbody>{bills.map(item => <tr key={item.id}>
        <td><b>{item.bill_number}</b><small>{item.bill_date} / due {item.due_date || '-'}</small></td>
        <td>{item.vendor_name}<small>{item.purpose}</small></td>
        <td>{item.category_name}</td>
        <td>{item.total_amount}<small>Tax {item.tax_amount}</small></td>
        <td>{item.paid_amount}<small>Due {item.outstanding_amount}</small></td>
        <td><span className={`delivery-status ${item.status}`}>{item.status}</span></td>
        <td><div className="expense-actions">
          {item.status === 'draft' && <button onClick={() => updateStatus(item, 'submitted')}>Submit</button>}
          {item.status === 'submitted' && <><button onClick={() => updateStatus(item, 'approved')}><CheckCircle2/>Approve</button><button onClick={() => updateStatus(item, 'rejected')}><XCircle/>Reject</button></>}
          {['draft', 'submitted', 'approved'].includes(item.status) && Number(item.paid_amount) === 0 && <button className="danger" onClick={() => updateStatus(item, 'cancelled')}>Cancel</button>}
        </div></td>
      </tr>)}{!bills.length && <tr><td colSpan="7">No expense bills found.</td></tr>}</tbody></table></div>
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Payments</span><h2>Recent vendor payments</h2></div><b>{payments.length} records</b></div>
      <div className="table-wrap expense-table"><table><thead><tr><th>Date</th><th>Bill</th><th>Vendor</th><th>Category</th><th>Amount</th><th>Mode</th><th>Reference</th></tr></thead><tbody>{payments.map(item => <tr key={item.id}><td>{item.payment_date}</td><td>{item.bill_number}</td><td>{item.vendor_name}</td><td>{item.category_name}</td><td>{item.amount}</td><td>{item.payment_mode}</td><td>{item.reference_no || '-'}</td></tr>)}{!payments.length && <tr><td colSpan="7">No payments recorded yet.</td></tr>}</tbody></table></div>
    </section>
  </div>
}
