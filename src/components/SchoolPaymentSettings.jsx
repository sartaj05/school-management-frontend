import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const paymentFields = { upi_id: 'School UPI ID', payee_name: 'UPI payee name', bank_name: 'Bank name', account_holder: 'Account holder', account_number: 'Account number', ifsc: 'IFSC', bank_url: 'Bank website (HTTPS, optional)' }

export default function SchoolPaymentSettings() {
  const [values, setValues] = useState({}), [message, setMessage] = useState(''), [busy, setBusy] = useState(true)
  useEffect(() => { let active = true; api('/fees/payment-settings').then(r => { if (active) setValues(r.data) }).catch(e => { if (active) setMessage(e.message) }).finally(() => { if (active) setBusy(false) }); return () => { active = false } }, [])
  async function save(e) { e.preventDefault(); setBusy(true); try { const r = await api('/fees/payment-settings', { method: 'PUT', body: JSON.stringify(values) }); setValues(r.data); setMessage(r.message) } catch (err) { setMessage(err.message) } finally { setBusy(false) } }
  return <details className="editor-card"><summary><strong>School UPI and bank details</strong></summary><p>Check these details carefully. Families use them to pay your school directly.</p><form onSubmit={save}><div className="field-grid">{Object.entries(paymentFields).map(([key, label]) => <label key={key}>{label}<input maxLength={255} value={values[key] || ''} type={key === 'bank_url' ? 'url' : 'text'} onChange={e => setValues({ ...values, [key]: e.target.value })} /></label>)}</div><p role="status">{message}</p><button className="button button-small" disabled={busy}>Save payment details</button></form></details>
}
