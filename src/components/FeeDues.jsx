import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function FeeDues() {
  const [days, setDays] = useState('7'), [rows, setRows] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  async function load() { setBusy(true); try { const r = await api(`/fees/dues?days=${days}`); setRows(r.data || []) } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [days]) // eslint-disable-line react-hooks/exhaustive-deps
  async function send() {
    if (!await confirmPopup({ title: 'Send fee reminders?', message: 'Notify linked parents in their portal. Amounts under verification and same-day duplicates are excluded.', confirmLabel: 'Send reminders', tone: 'primary' })) return
    setBusy(true)
    try { const r = await api(`/fees/dues?days=${days}`, { method: 'POST' }); setMessage(`${r.message} Students without linked parents: ${r.missing_parent_links}.`) } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  return <section className="data-panel"><div className="panel-title"><h2>Fee dues & reminders</h2><label>Due within <select value={days} onChange={e => setDays(e.target.value)}>{[0,7,30,90].map(d => <option key={d} value={d}>{d === 0 ? 'Today / overdue' : `${d} days`}</option>)}</select></label></div>
    <p>Installments include pending verification separately. Reminders are delivered to the parent portal.</p>
    <button className="button button-small" disabled={busy || !rows.some(r => r.collectible > 0)} onClick={send}>Send parent reminders</button> <button disabled={busy} onClick={load}>Refresh dues</button>
    {message && <p role="status">{message}</p>}<div className="table-wrap"><table><thead><tr><th>Student / class</th><th>Fee / installment</th><th>Due</th><th>Payable</th><th>Under verification</th></tr></thead><tbody>{rows.map(r => <tr key={`${r.invoice_id}:${r.installment_id}`}><td>{r.student_name}<small>{r.class_name} {r.section}</small></td><td>{r.fee_name}<small>{r.label}</small></td><td>{r.due_date || 'Not set'}<small>{r.status.replaceAll('_',' ')}</small></td><td>INR {r.collectible.toFixed(2)}</td><td>INR {r.pending.toFixed(2)}</td></tr>)}</tbody></table></div>{!busy && !rows.length && <p>No dues in this period.</p>}</section>
}
