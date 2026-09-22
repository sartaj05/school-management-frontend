import { BarChart3, Download, FileSpreadsheet, Printer, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'

const blankFilters = { from_date: '', to_date: '', class_name: '', section: '', status: '', academic_year: '', entry_type: '', role: '' }

export default function ReportsCenter({ user }) {
  const [catalog, setCatalog] = useState([])
  const [summary, setSummary] = useState({})
  const [report, setReport] = useState('students')
  const [filters, setFilters] = useState(blankFilters)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => { Promise.all([schoolApi.reportCatalog(), schoolApi.reportSummary()]).then(([catalogResult, summaryResult]) => { setCatalog(catalogResult.reports || []); setSummary(summaryResult.summary || {}); if (catalogResult.reports?.[0]) setReport(catalogResult.reports[0].key) }).catch(requestError => setError(requestError.message)) }, [])
  const selected = useMemo(() => catalog.find(item => item.key === report) || {}, [catalog, report])
  const field = (name, value) => setFilters(current => ({ ...current, [name]: value }))
  const query = () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
  async function downloadCsv() { setBusy(true); setError(''); setNotice(''); try { await schoolApi.downloadReportCsv(report, query()); setNotice(`${selected.label || 'Report'} CSV downloaded.`) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  async function downloadXlsx() { setBusy(true); setError(''); setNotice(''); try { await schoolApi.downloadReportXlsx(report, query()); setNotice(`${selected.label || 'Report'} XLSX downloaded.`) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  async function downloadPdf() { setBusy(true); setError(''); setNotice(''); try { await schoolApi.downloadReportPdf(report, query()); setNotice(`${selected.label || 'Report'} PDF downloaded.`) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  async function printReport() { setBusy(true); setError(''); setNotice(''); try { const blob = await schoolApi.reportHtml(report, query()); const url = URL.createObjectURL(blob); const popup = window.open(url, '_blank', 'noopener,noreferrer'); if (!popup) setNotice('Print report generated. Allow pop-ups to open it.'); else setNotice('Print-ready report opened. Use Print -> Save as PDF.'); setTimeout(() => URL.revokeObjectURL(url), 60000) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  const has = name => selected.filters?.includes(name)
  return <section className="reports-center">
    <section className="people-hero reports-hero"><div><span>Reports & exports</span><h2>See the whole school clearly.</h2><p>Run live reports from your current school data and download native CSV, XLSX or PDF files.</p></div><BarChart3 /></section>
    <div className="reports-summary">{[{ key: 'students', label: 'Students' }, { key: 'teachers', label: 'Teachers' }, { key: 'attendance', label: 'Attendance records' }, { key: 'fees', label: 'Fee invoices' }, { key: 'finance', label: 'Ledger entries' }].filter(item => summary[item.key] !== undefined && (item.key !== 'fees' || user?.role !== 'Teacher')).map(item => <article key={item.key}><small>{item.label}</small><b>{summary[item.key] ?? 0}</b><span>live records</span></article>)}</div>
    <section className="data-panel reports-builder"><div className="panel-title"><div><span>Live report builder</span><h2>Choose a report</h2></div><b>{catalog.length} available</b></div><div className="reports-builder-body"><div className="reports-report-picker">{catalog.map(item => <button type="button" key={item.key} className={report === item.key ? 'selected' : ''} onClick={() => { setReport(item.key); setFilters(blankFilters); setNotice(''); setError('') }}><FileSpreadsheet /><strong>{item.label}</strong><small>{item.description}</small></button>)}</div><form className="reports-filter" onSubmit={event => { event.preventDefault(); downloadCsv() }}>
      {has('from_date') && <label>From date<input type="date" value={filters.from_date} onChange={event => field('from_date', event.target.value)} /></label>}
      {has('to_date') && <label>To date<input type="date" value={filters.to_date} onChange={event => field('to_date', event.target.value)} /></label>}
      {has('class_name') && <label>Class<input value={filters.class_name} onChange={event => field('class_name', event.target.value)} placeholder="All classes" /></label>}
      {has('section') && <label>Section<input value={filters.section} onChange={event => field('section', event.target.value)} placeholder="All sections" /></label>}
      {has('status') && <label>Status<select value={filters.status} onChange={event => field('status', event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="present">Present</option><option value="absent">Absent</option><option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>}
      {has('academic_year') && <label>Academic year<input value={filters.academic_year} onChange={event => field('academic_year', event.target.value)} placeholder="2026-27" /></label>}
      {has('entry_type') && <label>Entry type<select value={filters.entry_type} onChange={event => field('entry_type', event.target.value)}><option value="">All entries</option><option value="income">Income</option><option value="fee_payment">Fee payment</option><option value="expense">Expense</option><option value="payroll">Payroll</option><option value="refund">Refund</option></select></label>}
      {has('role') && <label>Role<select value={filters.role} onChange={event => field('role', event.target.value)}><option value="">All roles</option><option>Teacher</option><option>Student</option><option>Parent</option><option>Hostel Staff</option><option>Accounts Staff</option></select></label>}
      <div className="reports-actions"><button className="button button-small" disabled={busy}><Download size={16} />{busy ? 'Preparing...' : 'Download CSV'}</button><button type="button" className="button button-ghost button-small" disabled={busy} onClick={downloadXlsx}><FileSpreadsheet size={16} />Download XLSX</button><button type="button" className="button button-ghost button-small" disabled={busy} onClick={downloadPdf}><Download size={16} />Download PDF</button><button type="button" className="button button-ghost button-small" disabled={busy} onClick={printReport}><Printer size={16} />Print HTML</button><button type="button" className="button button-ghost button-small" onClick={() => { setFilters(blankFilters); setNotice(''); setError('') }}><Search size={16} />Clear filters</button></div>
    </form>{error && <div className="form-error report-message">{error}</div>}{notice && <div className="success-notice report-message">{notice}</div>}</div></section>
  </section>
}
