import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'

const entities = [
  { value: 'students', label: 'Students', hint: 'Admission number, name, class, section and contact details' },
  { value: 'teachers', label: 'Teachers', hint: 'Teacher profile plus a temporary login password' },
  { value: 'classes', label: 'Classes', hint: 'Class name, section, class teacher and description' },
  { value: 'users', label: 'Users', hint: 'Login accounts for staff, students and parents' },
]

export default function OnboardingCenter() {
  const [entity, setEntity] = useState('students')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function chooseEntity(value) {
    setEntity(value); setFile(null); setPreview(null); setError(''); setMessage('')
  }

  async function checkFile(event) {
    event.preventDefault()
    if (!file) { setError('Choose a CSV file first.'); return }
    setBusy(true); setError(''); setMessage(''); setPreview(null)
    try { setPreview(await schoolApi.onboardingPreview(entity, file)) } catch (requestError) { setError(requestError.message); setPreview(requestError.data || null) } finally { setBusy(false) }
  }

  async function importFile() {
    if (!file || !preview?.success) return
    setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.onboardingImport(entity, file); setMessage(result.message); setPreview(null); setFile(null) } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const selected = entities.find(item => item.value === entity)
  const errors = preview?.errors || []
  return <section className="onboarding-center">
    <section className="data-panel onboarding-hero"><div><span>School setup</span><h2>Bring your school online faster.</h2><p>Download a template, fill it in Excel or Google Sheets, preview every row, then import clean records safely.</p></div><FileSpreadsheet /></section>
    <section className="data-panel onboarding-card"><div className="panel-title"><div><span>Bulk data import</span><h2>Import school records</h2></div><b>Up to 1,000 rows</b></div>
      <div className="onboarding-body">
        <div className="onboarding-type-grid">{entities.map(item => <button type="button" key={item.value} className={entity === item.value ? 'selected' : ''} onClick={() => chooseEntity(item.value)}><FileSpreadsheet /><strong>{item.label}</strong><small>{item.hint}</small></button>)}</div>
        <div className="onboarding-template-row"><p>Use the exact column names from the selected template. Required fields are checked before anything is saved.</p><button type="button" className="button button-ghost button-small" onClick={() => schoolApi.onboardingTemplate(entity)}><Download size={16} />Download {selected.label} template</button></div>
        <form className="onboarding-upload" onSubmit={checkFile}><label><Upload size={19} /><span>{file ? file.name : 'Choose a UTF-8 CSV file'}</span><input type="file" accept=".csv,text/csv" onChange={event => { setFile(event.target.files?.[0] || null); setPreview(null); setError(''); setMessage('') }} /></label><button className="button button-small" disabled={busy || !file}>{busy ? 'Checking…' : 'Preview CSV'}</button></form>
        {error && <div className="form-error onboarding-message"><XCircle size={16} />{error}</div>}
        {message && <div className="success-notice onboarding-message"><CheckCircle2 size={16} />{message}</div>}
        {preview && <div className="onboarding-preview"><div className="onboarding-preview-head"><div><strong>{preview.valid_rows || 0} valid rows</strong><small>{preview.row_count || 0} total rows checked</small></div>{preview.success ? <button className="button button-small" type="button" onClick={importFile} disabled={busy}>{busy ? 'Importing…' : 'Import records'}</button> : <span className="status-pill inactive">Fix {errors.length} row{errors.length === 1 ? '' : 's'}</span>}</div>{errors.length > 0 && <div className="onboarding-errors">{errors.map(item => <div key={item.row}><b>Row {item.row}</b><span>{item.errors.join(' · ')}</span></div>)}</div>}{preview.success && <div className="onboarding-ready"><CheckCircle2 /><span>{preview.message}</span></div>}</div>}
      </div>
    </section>
  </section>
}
