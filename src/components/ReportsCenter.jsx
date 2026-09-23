import { BarChart3, Download, FileSpreadsheet, Printer, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'
import { translateUi } from '../lib/i18n'

const blankFilters = { from_date: '', to_date: '', class_name: '', section: '', status: '', academic_year: '', entry_type: '', role: '' }

export default function ReportsCenter({ user, language = 'en' }) {
  const [catalog, setCatalog] = useState([])
  const [summary, setSummary] = useState({})
  const [report, setReport] = useState('students')
  const [filters, setFilters] = useState(blankFilters)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const t = value => translateUi(language, value)
  useEffect(() => { Promise.all([schoolApi.reportCatalog(), schoolApi.reportSummary()]).then(([catalogResult, summaryResult]) => { setCatalog(catalogResult.reports || []); setSummary(summaryResult.summary || {}); if (catalogResult.reports?.[0]) setReport(catalogResult.reports[0].key) }).catch(requestError => setError(requestError.message)) }, [])
  const selected = useMemo(() => catalog.find(item => item.key === report) || {}, [catalog, report])
  const field = (name, value) => setFilters(current => ({ ...current, [name]: value }))
  const query = () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
  async function downloadCsv() { setBusy(true); setError(''); setNotice(''); try { await schoolApi.downloadReportCsv(report, query()); setNotice(`${t(selected.label || 'Report')} CSV ${t('downloaded.')}`) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  async function downloadXlsx() { setBusy(true); setError(''); setNotice(''); try { await schoolApi.downloadReportXlsx(report, query()); setNotice(`${t(selected.label || 'Report')} XLSX ${t('downloaded.')}`) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  async function downloadPdf() { setBusy(true); setError(''); setNotice(''); try { await schoolApi.downloadReportPdf(report, query()); setNotice(`${t(selected.label || 'Report')} PDF ${t('downloaded.')}`) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  async function printReport() { setBusy(true); setError(''); setNotice(''); try { const blob = await schoolApi.reportHtml(report, query()); const url = URL.createObjectURL(blob); const popup = window.open(url, '_blank', 'noopener,noreferrer'); if (!popup) setNotice(t('Print report generated. Allow pop-ups to open it.')); else setNotice(t('Print-ready report opened. Use Print -> Save as PDF.')); setTimeout(() => URL.revokeObjectURL(url), 60000) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) } }
  const has = name => selected.filters?.includes(name)
  return <section className="reports-center">
    <section className="people-hero reports-hero"><div><span>{t('Reports & exports')}</span><h2>{t('See the whole school clearly.')}</h2><p>{t('Run live reports from your current school data and download native CSV, XLSX or PDF files.')}</p></div><BarChart3 /></section>
    <div className="reports-summary">{[{ key: 'students', label: 'Students' }, { key: 'teachers', label: 'Teachers' }, { key: 'attendance', label: 'Attendance records' }, { key: 'fees', label: 'Fee invoices' }, { key: 'finance', label: 'Ledger entries' }].filter(item => summary[item.key] !== undefined && (item.key !== 'fees' || user?.role !== 'Teacher')).map(item => <article key={item.key}><small>{t(item.label)}</small><b>{summary[item.key] ?? 0}</b><span>{t('live records')}</span></article>)}</div>
    <section className="data-panel reports-builder"><div className="panel-title"><div><span>{t('Live report builder')}</span><h2>{t('Choose a report')}</h2></div><b>{catalog.length} {t('available')}</b></div><div className="reports-builder-body"><div className="reports-report-picker">{catalog.map(item => <button type="button" key={item.key} className={report === item.key ? 'selected' : ''} onClick={() => { setReport(item.key); setFilters(blankFilters); setNotice(''); setError('') }}><FileSpreadsheet /><strong>{t(item.label)}</strong><small>{t(item.description)}</small></button>)}</div><form className="reports-filter" onSubmit={event => { event.preventDefault(); downloadCsv() }}>
      {has('from_date') && <label>{t('From date')}<input type="date" value={filters.from_date} onChange={event => field('from_date', event.target.value)} /></label>}
      {has('to_date') && <label>{t('To date')}<input type="date" value={filters.to_date} onChange={event => field('to_date', event.target.value)} /></label>}
      {has('class_name') && <label>{t('Class')}<input value={filters.class_name} onChange={event => field('class_name', event.target.value)} placeholder={t('All classes')} /></label>}
      {has('section') && <label>{t('Section')}<input value={filters.section} onChange={event => field('section', event.target.value)} placeholder={t('All sections')} /></label>}
      {has('status') && <label>{t('Status')}<select value={filters.status} onChange={event => field('status', event.target.value)}><option value="">{t('All statuses')}</option><option value="active">{t('Active')}</option><option value="inactive">{t('Inactive')}</option><option value="present">{t('Present')}</option><option value="absent">{t('Absent')}</option><option value="pending">{t('Pending')}</option><option value="partial">{t('Partial')}</option><option value="paid">{t('Paid')}</option><option value="overdue">{t('Overdue')}</option></select></label>}
      {has('academic_year') && <label>{t('Academic year')}<input value={filters.academic_year} onChange={event => field('academic_year', event.target.value)} placeholder="2026-27" /></label>}
      {has('entry_type') && <label>{t('Entry type')}<select value={filters.entry_type} onChange={event => field('entry_type', event.target.value)}><option value="">{t('All entries')}</option><option value="income">{t('Income')}</option><option value="fee_payment">{t('Fee payment')}</option><option value="expense">{t('Expense')}</option><option value="payroll">{t('Payroll')}</option><option value="refund">{t('Refund')}</option></select></label>}
      {has('role') && <label>{t('Role')}<select value={filters.role} onChange={event => field('role', event.target.value)}><option value="">{t('All roles')}</option><option>{t('Teacher')}</option><option>{t('Student')}</option><option>{t('Parent')}</option><option>{t('Hostel Staff')}</option><option>{t('Accounts Staff')}</option></select></label>}
      <div className="reports-actions"><button className="button button-small" disabled={busy}><Download size={16} />{busy ? t('Preparing...') : t('Download CSV')}</button><button type="button" className="button button-ghost button-small" disabled={busy} onClick={downloadXlsx}><FileSpreadsheet size={16} />{t('Download XLSX')}</button><button type="button" className="button button-ghost button-small" disabled={busy} onClick={downloadPdf}><Download size={16} />{t('Download PDF')}</button><button type="button" className="button button-ghost button-small" disabled={busy} onClick={printReport}><Printer size={16} />{t('Print HTML')}</button><button type="button" className="button button-ghost button-small" onClick={() => { setFilters(blankFilters); setNotice(''); setError('') }}><Search size={16} />{t('Clear filters')}</button></div>
    </form>{error && <div className="form-error report-message">{error}</div>}{notice && <div className="success-notice report-message">{notice}</div>}</div></section>
  </section>
}
