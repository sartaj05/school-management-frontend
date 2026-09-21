import { BadgePercent, CheckCircle2, CircleDollarSign, FileCheck2, Plus, RefreshCw, Save, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const year = new Date().getFullYear()
const emptyProgram = { name: '', program_type: 'scholarship', discount_type: 'amount', discount_value: '', academic_year: `${year}-${year + 1}`, budget_amount: 0, criteria: '' }
const emptyApplication = { program_id: '', student_id: '', requested_amount: '', reason: '' }
const emptyAward = { program_id: '', application_id: '', student_id: '', fee_invoice_id: '', discount_amount: '', notes: '' }

export default function ScholarshipManagement() {
  const [summary, setSummary] = useState({})
  const [programs, setPrograms] = useState([])
  const [applications, setApplications] = useState([])
  const [awards, setAwards] = useState([])
  const [students, setStudents] = useState([])
  const [invoices, setInvoices] = useState([])
  const [programForm, setProgramForm] = useState(emptyProgram)
  const [applicationForm, setApplicationForm] = useState(emptyApplication)
  const [awardForm, setAwardForm] = useState(emptyAward)
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedStudentInvoices = useMemo(() => invoices.filter(item => String(item.student_id) === String(awardForm.student_id)), [invoices, awardForm.student_id])
  const approvedApplications = useMemo(() => applications.filter(item => item.status === 'approved'), [applications])

  async function load(selectedStatus = status) {
    setBusy(true); setError('')
    try {
      const [summaryData, programData, applicationData, awardData, optionData] = await Promise.all([
        schoolApi.scholarshipSummary(),
        schoolApi.scholarshipPrograms(),
        schoolApi.scholarshipApplications(selectedStatus),
        schoolApi.scholarshipAwards(),
        schoolApi.scholarshipOptions(),
      ])
      setSummary(summaryData.summary || {})
      setPrograms(programData.data || [])
      setApplications(applicationData.data || [])
      setAwards(awardData.data || [])
      setStudents(optionData.students || [])
      setInvoices(optionData.invoices || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // Initial load intentionally starts with all scholarship applications.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = setTimeout(() => load('all'), 0); return () => clearTimeout(timer) }, [])

  async function saveProgram(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createScholarshipProgram({ ...programForm, discount_value: Number(programForm.discount_value), budget_amount: Number(programForm.budget_amount || 0) })
      setMessage(result.message); setProgramForm(emptyProgram); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveApplication(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createScholarshipApplication({ ...applicationForm, requested_amount: applicationForm.requested_amount || null })
      setMessage(result.message); setApplicationForm(emptyApplication); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function review(item, nextStatus) {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.reviewScholarshipApplication(item.id, { status: nextStatus, review_note: nextStatus === 'approved' ? 'Approved by accounts review.' : 'Not approved by accounts review.' })
      setMessage(result.message); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function saveAward(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.createScholarshipAward({ ...awardForm, application_id: awardForm.application_id || null, discount_amount: awardForm.discount_amount || null })
      setMessage(result.message); setAwardForm(emptyAward); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function revoke(item) {
    if (!await confirmPopup({ title: `Revoke ${item.program_name}?`, message: `This will remove ${item.discount_amount} concession from the linked invoice.`, confirmLabel: 'Revoke award', tone: 'danger' })) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.revokeScholarshipAward(item.id)
      setMessage(result.message); await load(status)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <div className="scholarship-management">
    <section className="people-hero scholarship-hero"><div><span>Premium finance</span><h2>Scholarships and concessions</h2><p>Approve student aid and apply fee discounts with a clear account history.</p></div><BadgePercent/></section>
    <div className="stat-grid compact scholarship-stats">{[
      ['Programs', summary.active_programs || 0],
      ['Pending', summary.pending_applications || 0],
      ['Awards', summary.active_awards || 0],
      ['Amount', summary.awarded_amount || 0],
      ['Invoices', summary.discounted_invoices || 0],
    ].map(([label, value]) => <article key={label}><small>{label}</small><b>{Number(value).toLocaleString()}</b><span>aid</span></article>)}</div>
    {error && <div className="form-error">{error}</div>}
    {message && <div className="success-notice">{message}</div>}

    <div className="scholarship-editor-grid">
      <form className="editor-card" onSubmit={saveProgram}>
        <div className="editor-heading"><CircleDollarSign/><div><h3>Create program</h3><p>Define scholarship or concession rules for the academic year.</p></div></div>
        <div className="field-grid three">
          <label>Name *<input required value={programForm.name} onChange={e => setProgramForm({ ...programForm, name: e.target.value })}/></label>
          <label>Type<select value={programForm.program_type} onChange={e => setProgramForm({ ...programForm, program_type: e.target.value })}><option value="scholarship">Scholarship</option><option value="concession">Concession</option></select></label>
          <label>Discount<select value={programForm.discount_type} onChange={e => setProgramForm({ ...programForm, discount_type: e.target.value })}><option value="amount">Amount</option><option value="percentage">Percentage</option></select></label>
          <label>Value *<input required type="number" min="0.01" max={programForm.discount_type === 'percentage' ? '100' : undefined} step="0.01" value={programForm.discount_value} onChange={e => setProgramForm({ ...programForm, discount_value: e.target.value })}/></label>
          <label>Academic year *<input required value={programForm.academic_year} onChange={e => setProgramForm({ ...programForm, academic_year: e.target.value })}/></label>
          <label>Budget<input type="number" min="0" step="0.01" value={programForm.budget_amount} onChange={e => setProgramForm({ ...programForm, budget_amount: e.target.value })}/></label>
          <label className="wide">Criteria<input value={programForm.criteria} onChange={e => setProgramForm({ ...programForm, criteria: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Save size={16}/>Save program</button>
      </form>

      <form className="editor-card" onSubmit={saveApplication}>
        <div className="editor-heading"><FileCheck2/><div><h3>Submit application</h3><p>Record a student request before approval.</p></div></div>
        <div className="field-grid three">
          <label>Program *<select required value={applicationForm.program_id} onChange={e => setApplicationForm({ ...applicationForm, program_id: e.target.value })}><option value="">Select program</option>{programs.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Student *<select required value={applicationForm.student_id} onChange={e => setApplicationForm({ ...applicationForm, student_id: e.target.value })}><option value="">Select student</option>{students.map(item => <option key={item.id} value={item.id}>{item.first_name} {item.last_name || ''} / {item.admission_no}</option>)}</select></label>
          <label>Requested amount<input type="number" min="0.01" step="0.01" value={applicationForm.requested_amount} onChange={e => setApplicationForm({ ...applicationForm, requested_amount: e.target.value })}/></label>
          <label className="wide">Reason *<input required value={applicationForm.reason} onChange={e => setApplicationForm({ ...applicationForm, reason: e.target.value })}/></label>
        </div>
        <button className="button button-small" disabled={busy}><Plus size={16}/>Submit application</button>
      </form>
    </div>

    <form className="editor-card" onSubmit={saveAward}>
      <div className="editor-heading"><CheckCircle2/><div><h3>Apply approved aid</h3><p>Post scholarship or concession amount as a discount on an outstanding invoice.</p></div></div>
      <div className="field-grid three">
        <label>Program *<select required value={awardForm.program_id} onChange={e => setAwardForm({ ...awardForm, program_id: e.target.value })}><option value="">Select program</option>{programs.filter(item => item.status === 'active').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Approved application<select value={awardForm.application_id} onChange={e => { const app = approvedApplications.find(item => String(item.id) === e.target.value); setAwardForm({ ...awardForm, application_id: e.target.value, program_id: app?.program_id || awardForm.program_id, student_id: app?.student_id || awardForm.student_id, discount_amount: app?.requested_amount || awardForm.discount_amount }) }}><option value="">Direct award</option>{approvedApplications.map(item => <option key={item.id} value={item.id}>{item.student_name} / {item.program_name}</option>)}</select></label>
        <label>Student *<select required value={awardForm.student_id} onChange={e => setAwardForm({ ...awardForm, student_id: e.target.value, fee_invoice_id: '' })}><option value="">Select student</option>{students.map(item => <option key={item.id} value={item.id}>{item.first_name} {item.last_name || ''} / {item.admission_no}</option>)}</select></label>
        <label>Invoice *<select required value={awardForm.fee_invoice_id} onChange={e => setAwardForm({ ...awardForm, fee_invoice_id: e.target.value })}><option value="">Select invoice</option>{selectedStudentInvoices.map(item => <option key={item.id} value={item.id}>{item.fee_name} / balance {item.balance}</option>)}</select></label>
        <label>Custom amount<input type="number" min="0.01" step="0.01" value={awardForm.discount_amount || ''} onChange={e => setAwardForm({ ...awardForm, discount_amount: e.target.value })}/></label>
        <label className="wide">Notes<input value={awardForm.notes} onChange={e => setAwardForm({ ...awardForm, notes: e.target.value })}/></label>
      </div>
      <button className="button button-small" disabled={busy}><Save size={16}/>Apply to invoice</button>
    </form>

    <section className="data-panel">
      <div className="panel-title"><div><span>Programs</span><h2>Scholarship and concession setup</h2></div><button className="refresh-button" onClick={() => load(status)} disabled={busy}><RefreshCw/>Refresh</button></div>
      <div className="scholarship-program-grid">{programs.map(item => <article key={item.id}><BadgePercent/><div><b>{item.name}</b><small>{item.program_type} / {item.academic_year}</small><p>{item.discount_type === 'percentage' ? `${item.discount_value}%` : item.discount_value} discount / {item.award_count || 0} awards</p></div><span className={`delivery-status ${item.status}`}>{item.status}</span></article>)}</div>
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Applications</span><h2>Review student requests</h2></div><select value={status} onChange={e => { setStatus(e.target.value); load(e.target.value) }}>{['all','submitted','approved','rejected','cancelled'].map(item => <option key={item}>{item}</option>)}</select></div>
      <div className="table-wrap scholarship-table"><table><thead><tr><th>Student</th><th>Program</th><th>Requested</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>{applications.map(item => <tr key={item.id}><td><b>{item.student_name}</b><small>{item.admission_no} / {item.class_name} {item.section}</small></td><td>{item.program_name}<small>{item.program_type}</small></td><td>{item.requested_amount || '-'}</td><td>{item.reason}</td><td><span className={`delivery-status ${item.status}`}>{item.status}</span></td><td>{item.status === 'submitted' && <div className="scholarship-actions"><button onClick={() => review(item, 'approved')}><CheckCircle2/>Approve</button><button onClick={() => review(item, 'rejected')}><XCircle/>Reject</button></div>}</td></tr>)}</tbody></table></div>
    </section>

    <section className="data-panel">
      <div className="panel-title"><div><span>Awards</span><h2>Applied fee concessions</h2></div><b>{awards.length} records</b></div>
      <div className="table-wrap scholarship-table"><table><thead><tr><th>Student</th><th>Program</th><th>Invoice</th><th>Discount</th><th>Status</th><th>Action</th></tr></thead><tbody>{awards.map(item => <tr key={item.id}><td><b>{item.student_name}</b><small>{item.admission_no}</small></td><td>{item.program_name}<small>{item.program_type}</small></td><td>{item.fee_name}<small>{item.invoice_status} / due {item.due_date}</small></td><td>{item.discount_amount}</td><td><span className={`delivery-status ${item.status}`}>{item.status}</span></td><td>{item.status === 'active' && <button className="refresh-button danger" onClick={() => revoke(item)}>Revoke</button>}</td></tr>)}</tbody></table></div>
    </section>
  </div>
}
