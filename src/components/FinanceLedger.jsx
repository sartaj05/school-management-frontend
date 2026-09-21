import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Plus, RefreshCw } from 'lucide-react'
import { schoolApi } from '../lib/api'

const emptyForm = { entry_type: 'income', source_type: 'manual', description: '', amount: '', entry_date: '', reference_no: '' }

export default function FinanceLedger() {
  const [summary, setSummary] = useState({})
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const filters = useMemo(() => ({ ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }), ...(status && { reconciliation_status: status }) }), [fromDate, toDate, status])
  const load = useCallback(async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const [totals, rows] = await Promise.all([schoolApi.financeSummary(filters), schoolApi.financeEntries({ ...filters, limit: 100 })])
      setSummary(totals.data || {}); setEntries(rows.data || [])
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }, [filters])

  useEffect(() => { const timer = setTimeout(() => load(), 0); return () => clearTimeout(timer) }, [load])

  const submit = async event => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.createFinanceEntry({ ...form, amount: Number(form.amount) }); setNotice(result.message || 'Ledger entry created.'); setForm(emptyForm); await load() } catch (err) { setError(err.message); setBusy(false) }
  }

  const reconcile = async (row, nextStatus = 'matched') => {
    setBusy(true); setError('')
    try { await schoolApi.reconcileFinanceEntry(row.id, { reconciliation_status: nextStatus }); await load() } catch (err) { setError(err.message); setBusy(false) }
  }

  const exportFile = async kind => {
    setBusy(true); setError(''); setNotice('')
    try { if (kind === 'csv') await schoolApi.downloadFinanceCsv(filters); else await schoolApi.downloadFinanceReport(filters); setNotice(`${kind.toUpperCase()} export downloaded.`) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="finance-ledger">
    <section className="people-hero finance-hero"><div><span>Shared finance</span><h2>Ledger and reconciliation</h2><p>Bring fees, payroll, vendor payments, refunds and manual entries into one audit-ready view.</p></div></section>
    {error && <div className="form-error api-notice"><b>Finance request failed.</b><span>{error}</span><button onClick={load}>Try again</button></div>}
    {notice && <div className="success-notice">{notice}</div>}
    <section className="data-panel finance-entry-list"><div className="panel-title"><div><span>Report filters</span><h2>Ledger period and status</h2></div><div className="button-row"><button className="refresh-button" onClick={() => exportFile('csv')} disabled={busy}><Download/>CSV</button><button className="refresh-button" onClick={() => exportFile('report')} disabled={busy}><Download/>Print / PDF</button><button className="refresh-button" onClick={load} disabled={busy}><RefreshCw/>Refresh</button></div></div><div className="field-grid three"><label>From<input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}/></label><label>To<input type="date" value={toDate} onChange={e => setToDate(e.target.value)}/></label><label>Reconciliation<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="unmatched">Unmatched</option><option value="review">Review</option><option value="matched">Matched</option></select></label></div></section>
    <div className="stat-grid compact finance-stats">{[['Income', summary.income || 0], ['Expenses', summary.expenses || 0], ['Refunds', summary.refunds || 0], ['To reconcile', summary.pending_reconciliation || 0]].map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span>Filtered ledger</span></article>)}</div>
    <section className="data-panel finance-entry-form"><div className="panel-title"><div><span>Manual adjustment</span><h2>Post a ledger entry</h2></div></div><form onSubmit={submit}><div className="field-grid three"><label>Type<select value={form.entry_type} onChange={e => setForm({ ...form, entry_type: e.target.value })}>{['income','expense','refund','payroll','vendor_payment','fee_payment'].map(item => <option key={item}>{item}</option>)}</select></label><label>Source<input value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value })} required maxLength="40"/></label><label>Date<input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })}/></label><label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required/></label><label>Reference<input value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })}/></label><label className="wide">Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required maxLength="2000"/></label></div><button className="button button-small" disabled={busy}><Plus size={16}/>Post entry</button></form></section>
    <section className="data-panel finance-entry-list"><div className="panel-title"><div><span>Audit trail</span><h2>Ledger entries</h2></div><b>{entries.length} records</b></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{entries.length === 0 ? <tr><td colSpan="6">No finance entries for these filters.</td></tr> : entries.map(row => <tr key={row.id}><td>{row.entry_date}</td><td><span className="status-pill">{row.entry_type}</span></td><td><b>{row.description}</b><small>{row.source_type} {row.reference_no || ''}</small></td><td>{row.amount}</td><td>{row.reconciliation_status}</td><td>{row.reconciliation_status === 'matched' ? <CheckCircle2 className="finance-matched"/> : <div className="button-row"><button className="refresh-button" onClick={() => reconcile(row)} disabled={busy}>Match</button><button className="refresh-button" onClick={() => reconcile(row, 'review')} disabled={busy}>Review</button></div>}</td></tr>)}</tbody></table></div></section>
  </div>
}
