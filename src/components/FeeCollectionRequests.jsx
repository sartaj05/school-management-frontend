import { CheckCircle2, ClipboardCheck, Receipt, Send, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const today = new Date().toISOString().slice(0, 10)
const methods = ['cash', 'upi', 'online', 'card', 'bank_transfer', 'cheque']

export default function FeeCollectionRequests({ admin = false }) {
  const [options, setOptions] = useState([])
  const [requests, setRequests] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState('')
  const [form, setForm] = useState({ amount: '', payment_date: today, payment_method: 'cash', reference_number: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setBusy(true); setError('')
    try {
      const responses = admin
        ? [await schoolApi.feeCollectionRequests('pending')]
        : await Promise.all([schoolApi.feeCollectionOptions(), schoolApi.feeCollectionRequests('all')])
      if (admin) setRequests(responses[0].data || [])
      else { setOptions(responses[0].data || []); setRequests(responses[1].data || []) }
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [admin])

  function chooseInvoice(value) {
    const item = options.find(row => String(row.invoice_id) === value)
    setSelectedInvoice(value)
    setForm(current => ({ ...current, amount: item?.available_amount ?? '', reference_number: '', notes: '' }))
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.submitFeeCollectionRequest({ ...form, invoice_id: Number(selectedInvoice), amount: Number(form.amount) })
      setMessage(result.message); setSelectedInvoice(''); setForm({ amount: '', payment_date: today, payment_method: 'cash', reference_number: '', notes: '' }); await load()
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  async function review(item, status) {
    const review_notes = status === 'rejected' ? window.prompt('Reason for rejection (optional):', '') || '' : ''
    setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.reviewFeeCollectionRequest(item.id, { status, review_notes }); setMessage(result.message); await load() }
    catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  return <section className="data-panel fee-collection-requests">
    <div className="panel-title"><div><span>{admin ? 'Admin approval queue' : 'Teacher collection'}</span><h2>{admin ? 'Pending fee submissions' : 'Submit collected fee'}</h2></div><b>{admin ? requests.length : options.length} records</b></div>
    {error && <div className="form-error">{error}</div>}{message && <div className="success-notice">{message}</div>}
    {!admin && <form className="field-grid three" onSubmit={submit}><label className="wide">Student invoice *<select required value={selectedInvoice} onChange={event => chooseInvoice(event.target.value)}><option value="">Select assigned student invoice</option>{options.map(item => <option key={item.invoice_id} value={item.invoice_id}>{item.student_name} / {item.admission_no} · {item.fee_name} · available {item.available_amount}</option>)}</select></label><label>Amount collected *<input required type="number" min="0.01" step="0.01" max={options.find(item => String(item.invoice_id) === selectedInvoice)?.available_amount} value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })}/></label><label>Payment date *<input required type="date" value={form.payment_date} onChange={event => setForm({ ...form, payment_date: event.target.value })}/></label><label>Method<select value={form.payment_method} onChange={event => setForm({ ...form, payment_method: event.target.value })}>{methods.map(method => <option key={method}>{method}</option>)}</select></label><label>Reference<input value={form.reference_number} onChange={event => setForm({ ...form, reference_number: event.target.value })} placeholder="UPI or receipt reference"/></label><label className="wide">Notes<textarea rows="2" value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="Optional collection note"/></label><button className="button button-small" disabled={busy || !selectedInvoice}><Send size={16}/>{busy ? 'Submitting...' : 'Send for admin approval'}</button></form>}
    <div className="table-wrap"><table><thead><tr><th>Student</th><th>Fee</th><th>Amount</th><th>Method</th><th>Status</th><th>Submitted</th>{admin && <th>Actions</th>}</tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><b>{item.student_name}</b><small>{item.admission_no} · {item.class_name} {item.section}</small></td><td>{item.fee_name}<small>Invoice balance {item.current_balance}</small></td><td>{item.amount}</td><td>{item.payment_method}<small>{item.reference_number || 'No reference'}</small></td><td><span className={`delivery-status ${item.status}`}>{item.status}</span>{item.review_notes && <small>{item.review_notes}</small>}</td><td>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>{admin && <td><div className="student-row-actions"><button onClick={() => review(item, 'approved')} disabled={busy}><CheckCircle2/>Approve</button><button className="danger" onClick={() => review(item, 'rejected')} disabled={busy}><XCircle/>Reject</button></div></td>}</tr>)}{!requests.length && <tr><td colSpan={admin ? 7 : 6}><div className="empty-state"><Receipt/><h3>{admin ? 'No pending fee submissions' : 'No collection requests yet'}</h3><p>{admin ? 'Teacher-submitted fees will appear here until approval.' : 'Submit a collected amount for an assigned student.'}</p></div></td></tr>}</tbody></table></div>
  </section>
}
