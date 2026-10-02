import { Download, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import DocumentTemplateManager from './DocumentTemplateManager'

export default function DocumentExports() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = () => schoolApi.documents().then(result => setRows(result.data || [])).catch(requestError => setError(requestError.message))
  useEffect(load, [])
  async function attendance() {
    try { await schoolApi.downloadAttendanceCsv(date); setNotice('Attendance CSV download started.'); load() } catch (requestError) { setError(requestError.message) }
  }
  return <>
    <section className="people-hero"><div><span>Documents & exports</span><h2>Printable school records</h2><p>Download attendance spreadsheets and generate published report cards.</p></div><FileText /></section>
    <section className="editor-card export-card"><label>Attendance date<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label><button className="button button-small" onClick={attendance}><Download size={16} />Download attendance CSV</button></section>
    <DocumentTemplateManager />
    {error && <div className="form-error">{error}</div>}{notice && <div className="success-notice">{notice}</div>}
    <section className="data-panel"><div className="panel-title"><div><span>Generation history</span><h2>Recent documents</h2></div><b>{rows.length} records</b></div><div className="table-wrap"><table><thead><tr><th>Document</th><th>Reference</th><th>Created</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.filename}</b><small>{row.document_type}</small></td><td>{row.reference_id || '—'}</td><td>{new Date(row.created_at).toLocaleString()}</td></tr>)}</tbody></table></div></section>
  </>
}
