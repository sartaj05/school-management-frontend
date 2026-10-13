import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { upiPaymentUrl } from '../lib/feePayment'
import './FeePaymentPage.css'

export default function FeePaymentPage() {
  const initialId = new URLSearchParams(window.location.search).get('invoice')
  const [rows, setRows] = useState([]), [settings, setSettings] = useState({}), [cashStaff, setCashStaff] = useState(false)
  const [invoice, setInvoice] = useState(initialId || ''), [amount, setAmount] = useState(''), [step, setStep] = useState(1)
  const [method, setMethod] = useState('cash'), [reference, setReference] = useState(''), [notes, setNotes] = useState('')
  const [date, setDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })
  const [busy, setBusy] = useState(true), [error, setError] = useState(''), [result, setResult] = useState(null)
  const key = useRef(crypto.randomUUID()), heading = useRef(null), submitting = useRef(false)
  const [proof, setProof] = useState(null)
  async function uploadProof(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Payment proof must be 5 MB or smaller.'); return }
    setBusy(true); setError('')
    try { const body = new FormData(); body.append('file', file); body.append('category', 'payment_proof'); const r = await api('/documents/files', { method: 'POST', body }); setProof(r.file) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const selected = rows.find(row => String(row.id) === String(invoice))
  useEffect(() => { let active = true; api(`/fees/invoices/${encodeURIComponent(initialId)}/payment-options`).then(r => {
    if (!active) return
    setRows(r.data); setSettings(r.settings); setCashStaff(r.can_record_cash)
    const row = r.data.find(x => String(x.id) === initialId) || r.data[0]
    if (row) { setInvoice(String(row.id)); setAmount(String(row.available_amount)) }
  }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setBusy(false) }); return () => { active = false } }, [initialId])
  useEffect(() => { heading.current?.focus() }, [step, result])
  function next(e) { e.preventDefault(); setError(''); if (!selected || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > Number(selected.available_amount)) { setError('Enter an amount within the available balance.'); return }; setStep(2) }
  function choose(value) {
    setMethod(value); setReference(''); setError('')
    if (value === 'upi' && settings.upi_id) window.location.assign(upiPaymentUrl(settings, amount, selected.fee_name))
    if (value === 'bank_transfer' && settings.bank_url?.startsWith('https://')) window.open(settings.bank_url, '_blank', 'noopener,noreferrer')
  }
  async function submit(e) {
    e.preventDefault(); if (submitting.current) return
    submitting.current = true; setBusy(true); setError('')
    try {
      const r = await api(`/fees/invoices/${invoice}/direct-payment`, { method: 'POST', body: JSON.stringify({ amount: Number(amount), payment_method: method, payment_date: date, reference_number: reference, notes, proof_file_id: proof?.id, request_key: key.current }) })
      setResult(r)
      const channel = new BroadcastChannel('school-fee-updates'); channel.postMessage('refresh'); channel.close()
    } catch (e) { setError(e.message) } finally { setBusy(false); submitting.current = false }
  }
  const configured = method === 'cash' || (method === 'upi' ? Boolean(settings.upi_id) : Boolean(settings.account_number))
  return <main className="fee-checkout"><header><Link to="/dashboard">← EduFlow dashboard</Link><span>School fee payment</span></header><section className="fee-checkout-dialog" role="dialog" aria-labelledby="payment-heading">
    <p className="fee-checkout-eyebrow">{result ? 'Submission complete' : `Step ${step} of 2`}</p><h1 id="payment-heading" ref={heading} tabIndex={-1}>{result ? (result.status === 'pending' ? 'Awaiting school verification' : 'Cash payment recorded') : step === 1 ? 'Choose your fee' : 'Choose how to pay'}</h1>
    {error && <p role="alert" className="form-error">{error}</p>}
    {result ? <><p role="status">{result.message}</p><p>{selected?.fee_name} · ₹{Number(amount).toFixed(2)}</p><Link className="button" to="/dashboard">Return to dashboard</Link></> : step === 1 ? <form onSubmit={next}>
      <label>Fee type<select required value={invoice} disabled={busy} onChange={e => { setInvoice(e.target.value); setAmount(String(rows.find(x => String(x.id) === e.target.value)?.available_amount || '')) }}><option value="">Select fee type</option>{rows.map(row => <option key={row.id} value={row.id}>{row.fee_name} — invoice #{row.id}</option>)}</select></label>
      <label>Enter amount (₹)<input required type="number" min="0.01" step="0.01" max={selected?.available_amount} value={amount} onChange={e => setAmount(e.target.value)} /></label><p>Available balance: ₹{selected?.available_amount ?? '—'}. Pending submissions are excluded.</p>
      {!busy && !rows.length && <p>No unpaid fees are available for this student.</p>}<button className="button" disabled={busy || !rows.length}>{busy ? 'Loading…' : 'Next: payment method'}</button></form> : <form onSubmit={submit}>
      <p>{selected?.fee_name} · <strong>₹{Number(amount).toFixed(2)}</strong></p><label>Payment method<select value={method} disabled={busy} onChange={e => choose(e.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="bank_transfer">Bank transfer</option></select></label>
      {method === 'cash' ? <p>{cashStaff ? 'Confirm only cash you have received at the school.' : 'Pay cash at the school office. This submission requires staff confirmation.'}</p> : !configured ? <p role="status">School Admin has not added {method === 'upi' ? 'UPI' : 'bank'} details. Contact the school or select Cash.</p> : <div className="fee-bank-details">
        {method === 'upi' ? <><strong>{settings.payee_name}</strong><p>UPI ID: <code>{settings.upi_id}</code></p><a className="button" href={upiPaymentUrl(settings, amount, selected.fee_name)}>Open UPI app</a><p>On desktop, use this UPI ID in your phone’s payment app.</p></> : <><strong>{settings.bank_name}</strong><p>Account holder: {settings.account_holder}</p><p>Account number: <code>{settings.account_number}</code></p><p>IFSC: <code>{settings.ifsc}</code></p>{settings.bank_url ? <a className="button" href={settings.bank_url} target="_blank" rel="noopener noreferrer">Open bank website</a> : <p>Use your bank’s app or website to transfer to this account.</p>}</>}
        <p>After paying, return here and enter your transaction reference. Opening an app does not confirm payment.</p></div>}
      <label>Payment proof (optional, PDF or image, max 5 MB)<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" disabled={busy} onChange={e => uploadProof(e.target.files[0])} /></label>{proof && <p role="status">Attached: {proof.original_filename} <button type="button" disabled={busy} onClick={() => setProof(null)}>Remove attachment</button></p>}
      <label>Payment date<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label><label>{method === 'cash' ? 'Receipt reference (optional)' : 'Transaction reference / UTR'}<input required={method !== 'cash'} minLength={method !== 'cash' ? 4 : undefined} maxLength={100} value={reference} onChange={e => setReference(e.target.value)} /></label><label>Notes (optional)<textarea maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      <div className="fee-checkout-actions"><button type="button" disabled={busy} onClick={() => { setStep(1); setError('') }}>Back</button><button className="button" disabled={busy || !configured}>{busy ? 'Saving…' : method === 'cash' && cashStaff ? 'Confirm cash received' : 'Submit for verification'}</button></div></form>}
  </section></main>
}
