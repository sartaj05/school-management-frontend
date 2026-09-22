import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Plus, RefreshCw } from 'lucide-react'
import { schoolApi } from '../lib/api'

const emptyForm = { entry_type: 'income', source_type: 'manual', description: '', amount: '', entry_date: '', reference_no: '' }
const emptySettlement = { settlement_date: '', opening_balance: '0', notes: '' }

export default function FinanceLedger() {
  const [summary, setSummary] = useState({})
  const [entries, setEntries] = useState([])
  const [settlements, setSettlements] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [settlementForm, setSettlementForm] = useState(emptySettlement)
  const [selectedSettlementId, setSelectedSettlementId] = useState('')
  const [countedBalance, setCountedBalance] = useState('')
  const [matchEntry, setMatchEntry] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const filters = useMemo(() => ({ ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }), ...(status && { reconciliation_status: status }) }), [fromDate, toDate, status])
  const selectedSettlement = settlements.find(item => String(item.id) === String(selectedSettlementId)) || settlements[0]

  const load = useCallback(async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const [totals, rows, daily] = await Promise.all([
        schoolApi.financeSummary(filters),
        schoolApi.financeEntries({ ...filters, limit: 100 }),
        schoolApi.financeSettlements({ ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }) }),
      ])
      setSummary(totals.data || {}); setEntries(rows.data || []); setSettlements(daily.data || [])
      if (!selectedSettlementId && daily.data?.[0]) setSelectedSettlementId(String(daily.data[0].id))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }, [filters, fromDate, toDate, selectedSettlementId])

  useEffect(() => { const timer = setTimeout(() => load(), 0); return () => clearTimeout(timer) }, [load])

  const submit = async event => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.createFinanceEntry({ ...form, amount: Number(form.amount) }); setNotice(result.message || 'Ledger entry created.'); setForm(emptyForm); await load() } catch (err) { setError(err.message); setBusy(false) }
  }

  const openSettlement = async event => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.createFinanceSettlement({ ...settlementForm, opening_balance: Number(settlementForm.opening_balance) }); setNotice(result.message || 'Daily settlement opened.'); setSettlementForm(emptySettlement); setSelectedSettlementId(String(result.data.id)); await load() } catch (err) { setError(err.message); setBusy(false) }
  }

  const closeSettlement = async event => {
    event.preventDefault(); if (!selectedSettlement) return
    setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.closeFinanceSettlement(selectedSettlement.id, { counted_balance: Number(countedBalance) }); setNotice(result.message || 'Daily settlement closed.'); setCountedBalance(''); await load() } catch (err) { setError(err.message); setBusy(false) }
  }

  const reconcile = async (row, nextStatus = 'matched') => {
    setBusy(true); setError('')
    try { await schoolApi.reconcileFinanceEntry(row.id, { reconciliation_status: nextStatus }); await load() } catch (err) { setError(err.message); setBusy(false) }
  }

  const match = async event => {
    event.preventDefault(); if (!matchEntry) return
    setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.matchFinanceEntry(matchEntry.id, { settlement_id: Number(matchEntry.settlement_id), external_reference: matchEntry.external_reference, external_amount: Number(matchEntry.external_amount) }); setNotice(result.message || 'Payment reference matched.'); setMatchEntry(null); await load() } catch (err) { setError(err.message); setBusy(false) }
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
    <section className="data-panel finance-entry-form"><div className="panel-title"><div><span>Daily close</span><h2>Settlement and bank matching</h2></div><b>{settlements.length} days</b></div><div className="field-grid three"><form onSubmit={openSettlement}><label>Date<input type="date" value={settlementForm.settlement_date} onChange={e => setSettlementForm({ ...settlementForm, settlement_date: e.target.value })} required/></label><label>Opening balance<input type="number" min="0" step="0.01" value={settlementForm.opening_balance} onChange={e => setSettlementForm({ ...settlementForm, opening_balance: e.target.value })} required/></label><label>Notes<input value={settlementForm.notes} onChange={e => setSettlementForm({ ...settlementForm, notes: e.target.value })}/></label><button className="button button-small" disabled={busy}><Plus size={16}/>Open settlement</button></form><div><label>Settlement day<select value={selectedSettlement?.id || ''} onChange={e => setSelectedSettlementId(e.target.value)}><option value="">Select a day</option>{settlements.map(item => <option key={item.id} value={item.id}>{item.settlement_date} · {item.status}</option>)}</select></label>{selectedSettlement && <small>Expected {selectedSettlement.expected_balance} · Pending {selectedSettlement.pending_entries}</small>}</div><form onSubmit={closeSettlement}><label>Counted balance<input type="number" min="0" step="0.01" value={countedBalance} onChange={e => setCountedBalance(e.target.value)} required disabled={!selectedSettlement || selectedSettlement.status === 'closed'}/></label><button className="button button-small" disabled={busy || !selectedSettlement || selectedSettlement.status === 'closed'}>Close day</button></form></div></section>
    {matchEntry && <section className="data-panel finance-entry-form"><div className="panel-title"><div><span>Bank or gateway reference</span><h2>Match: {matchEntry.description}</h2></div><button className="refresh-button" onClick={() => setMatchEntry(null)}>Cancel</button></div><form onSubmit={match}><div className="field-grid three"><label>Settlement<select value={matchEntry.settlement_id} onChange={e => setMatchEntry({ ...matchEntry, settlement_id: e.target.value })} required><option value="">Select an open day</option>{settlements.filter(item => item.status !== 'closed').map(item => <option key={item.id} value={item.id}>{item.settlement_date}</option>)}</select></label><label>External reference<input value={matchEntry.external_reference} onChange={e => setMatchEntry({ ...matchEntry, external_reference: e.target.value })} required/></label><label>External amount<input type="number" min="0.01" step="0.01" value={matchEntry.external_amount} onChange={e => setMatchEntry({ ...matchEntry, external_amount: e.target.value })} required/></label></div><button className="button button-small" disabled={busy}>Confirm bank match</button></form></section>}
    <section className="data-panel finance-entry-form"><div className="panel-title"><div><span>Manual adjustment</span><h2>Post a ledger entry</h2></div></div><form onSubmit={submit}><div className="field-grid three"><label>Type<select value={form.entry_type} onChange={e => setForm({ ...form, entry_type: e.target.value })}>{['income','expense','refund','payroll','vendor_payment','fee_payment'].map(item => <option key={item}>{item}</option>)}</select></label><label>Source<input value={form.source_type} onChange={e => setForm({ ...form, source_type: e.target.value })} required maxLength="40"/></label><label>Date<input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })}/></label><label>Amount<input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required/></label><label>Reference<input value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })}/></label><label className="wide">Description<input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required maxLength="2000"/></label></div><button className="button button-small" disabled={busy}><Plus size={16}/>Post entry</button></form></section>
    <section className="data-panel finance-entry-list"><div className="panel-title"><div><span>Audit trail</span><h2>Ledger entries</h2></div><b>{entries.length} records</b></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{entries.length === 0 ? <tr><td colSpan="6">No finance entries for these filters.</td></tr> : entries.map(row => <tr key={row.id}><td>{row.entry_date}</td><td><span className="status-pill">{row.entry_type}</span></td><td><b>{row.description}</b><small>{row.source_type} {row.reference_no || ''}</small></td><td>{row.amount}</td><td>{row.reconciliation_status}</td><td>{row.reconciliation_status === 'matched' ? <CheckCircle2 className="finance-matched"/> : <div className="button-row"><button className="refresh-button" onClick={() => setMatchEntry({ id: row.id, description: row.description, settlement_id: selectedSettlement?.status === 'closed' ? '' : selectedSettlement?.id || '', external_reference: row.reference_no || '', external_amount: row.amount })} disabled={busy}>Bank match</button><button className="refresh-button" onClick={() => reconcile(row, 'review')} disabled={busy}>Review</button></div>}</td></tr>)}</tbody></table></div></section>
  </div>
}
