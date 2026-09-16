import { Banknote, Download, Pencil, Printer, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const localToday = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const blankSalary = { teacher_id: '', basic_salary: '', allowances: '0', deductions: '0' }
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0))
const monthLabel = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

export default function PayrollManagement() {
  const [day, setDay] = useState(localToday)
  const [month, setMonth] = useState(() => localToday().slice(0, 7))
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState(null)
  const [salary, setSalary] = useState(blankSalary)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const salaryForm = useRef(null)
  const key = `${day}:${month}:${revision}`

  useEffect(() => {
    let active = true
    Promise.all([schoolApi.staffAttendance(day), schoolApi.salaryStructures(), schoolApi.payslips(`${month}-01`)])
      .then(([a, s, p]) => {
        if (active) setSnapshot({ key, attendance: a.data || [], structures: s.data || [], payslips: p.data || [] })
      })
      .catch(e => { if (active) setSnapshot({ key, error: e.message, attendance: [], structures: [], payslips: [] }) })
    return () => { active = false }
  }, [day, month, key])

  const loaded = snapshot?.key === key
  const attendance = loaded ? snapshot.attendance : []
  const structures = loaded ? snapshot.structures : []
  const payslips = loaded ? snapshot.payslips : []
  const disabled = busy || !loaded || Boolean(snapshot?.error)
  const net = Number(salary.basic_salary || 0) + Number(salary.allowances || 0) - Number(salary.deductions || 0)
  const finalized = payslips.some(row => row.payroll_status === 'finalized')
  const field = (name, value) => setSalary(current => ({ ...current, [name]: value }))

  function selectTeacher(id) {
    const existing = structures.find(row => String(row.teacher_id) === String(id))
    setSalary(existing ? { teacher_id: String(id), basic_salary: String(existing.basic_salary), allowances: String(existing.allowances), deductions: String(existing.deductions) } : { ...blankSalary, teacher_id: String(id) })
  }

  async function mutate(action) {
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await action()
      setNotice(result.message)
      setRevision(value => value + 1)
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function saveSalary(event) {
    event.preventDefault()
    if (!Number.isFinite(net) || net < 0) { setError('Deductions cannot exceed basic salary plus allowances.'); return }
    await mutate(() => schoolApi.saveSalaryStructure(salary))
  }

  async function generate() {
    if (payslips.length && !await confirmPopup({
      title: `Regenerate ${monthLabel(month)} payroll?`,
      message: 'Existing draft payslips for active teachers will be updated using their current salary structures. Other months are unchanged.',
      confirmLabel: 'Regenerate payslips',
    })) return
    await mutate(() => schoolApi.runPayroll({ payroll_month: `${month}-01` }))
  }

  async function documentFor(row, print) {
    const preview = print ? window.open('', '_blank') : null
    if (print && !preview) { setError('Allow pop-ups to open the payslip print view.'); return }
    if (preview) { preview.opener = null; preview.document.title = 'Loading payslip'; preview.document.body.textContent = 'Loading payslip…' }
    setBusy(true); setError('')
    try {
      const result = await schoolApi.payslipDocument(row.id)
      const { html, filename } = result.data
      if (print) {
        if (!preview.closed) {
          preview.document.open(); preview.document.write(html); preview.document.close()
          preview.focus(); preview.print()
        }
      } else {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
        const link = document.createElement('a')
        link.href = url; link.download = filename
        document.body.appendChild(link); link.click(); link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (e) { preview?.close(); setError(e.message) }
    finally { setBusy(false) }
  }

  return <div className="payroll-management">
    <section className="people-hero"><div><span>Premium staff operations</span><h2>Attendance and payroll</h2><p>Set teacher salaries, generate monthly payslips, and print or download saved payroll.</p></div><Banknote /></section>
    <div className="page-actions payroll-toolbar">
      <label>Payroll month<input type="month" required value={month} disabled={busy} onChange={e => { if (e.target.value) { setMonth(e.target.value); setError(''); setNotice('') } }} /></label>
      <button className="button button-small" disabled={disabled || !structures.length || finalized} onClick={generate}>{busy ? 'Working…' : `${payslips.length ? 'Regenerate' : 'Generate'} ${monthLabel(month)} payslips`}</button>
    </div>
    {(error || (loaded && snapshot.error)) && <div className="form-error" role="alert">{error || snapshot.error}<button type="button" className="text-action" disabled={busy} onClick={() => { setError(''); setRevision(v => v + 1) }}>Reload payroll</button></div>}
    {notice && <div className="success-notice" role="status">{notice}</div>}
    {!loaded && <p role="status">Loading payroll…</p>}
    <form ref={salaryForm} className="editor-card payroll-salary-form" onSubmit={saveSalary}>
      <div className="editor-heading"><Banknote /><div><h3>Salary setup</h3><p>Choose a teacher to add or update a monthly salary. Changes apply when you generate or regenerate payroll.</p></div></div>
      <fieldset disabled={disabled}>
        <div className="field-grid">
          <label>Teacher<select required value={salary.teacher_id} onChange={e => selectTeacher(e.target.value)}><option value="">Select an active teacher</option>{attendance.map(row => <option key={row.teacher_id} value={row.teacher_id}>{row.full_name}{row.department ? ` · ${row.department}` : ''}</option>)}</select></label>
          {[['basic_salary', 'Basic salary (INR)'], ['allowances', 'Allowances (INR)'], ['deductions', 'Deductions (INR)']].map(([name, label]) => <label key={name}>{label}<input required type="number" min="0" max="9999999999.99" step="0.01" value={salary[name]} onChange={e => field(name, e.target.value)} /></label>)}
        </div>
        <div className="payroll-salary-footer"><span>Net monthly salary <strong>{money(net)}</strong></span><button className="button button-small" disabled={!salary.teacher_id || net < 0}><Save size={16} />Save salary</button></div>
      </fieldset>
      <p className="payroll-help">Attendance and leave do not automatically reduce salary. Enter any adjustments in deductions.</p>
    </form>
    <section className="data-panel"><div className="panel-title"><div><span>Monthly configuration</span><h2>Salary structures</h2></div><b>{structures.length} teachers</b></div>
      <div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net salary</th><th>Action</th></tr></thead><tbody>
        {structures.map(row => <tr key={row.teacher_id}><td><b>{row.full_name}</b><small>{row.department || '—'}</small></td><td>{money(row.basic_salary)}</td><td>{money(row.allowances)}</td><td>{money(row.deductions)}</td><td>{money(Number(row.basic_salary) + Number(row.allowances) - Number(row.deductions))}</td><td><button className="button button-small button-ghost" disabled={disabled} onClick={() => { selectTeacher(row.teacher_id); salaryForm.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); salaryForm.current?.querySelector('select')?.focus({ preventScroll: true }) }}><Pencil size={14} />Edit</button></td></tr>)}
        {loaded && !structures.length && <tr><td colSpan="6">No salary structures yet. Set up a teacher salary above.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="data-panel"><div className="panel-title"><div><span>{monthLabel(month)}</span><h2>Payslips</h2><p className="payroll-help">Print to paper or choose Save as PDF. Download saves a printable HTML payslip.</p></div><b>{payslips.length} records</b></div>
      {finalized && <p className="payroll-help">This month is finalized and cannot be regenerated.</p>}
      <div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net salary</th><th>Status</th><th>Payslip</th></tr></thead><tbody>
        {payslips.map(row => <tr key={row.id}><td><b>{row.full_name}</b><small>{row.department || '—'}</small></td><td>{money(row.basic_salary)}</td><td>{money(row.allowances)}</td><td>{money(row.deductions)}</td><td><b>{money(row.net_salary)}</b></td><td>{row.payroll_status}</td><td><div className="payroll-row-actions"><button className="button button-small button-ghost" disabled={disabled} onClick={() => documentFor(row, true)} aria-label={`Print payslip for ${row.full_name}`}><Printer size={14} />Print / PDF</button><button className="button button-small button-ghost" disabled={disabled} onClick={() => documentFor(row, false)} aria-label={`Download payslip for ${row.full_name}`}><Download size={14} />Download HTML</button></div></td></tr>)}
        {loaded && !payslips.length && <tr><td colSpan="7">No payslips for {monthLabel(month)}. Set salaries and generate this month’s payroll.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="data-panel"><div className="panel-title"><div><span>Daily register</span><h2>Staff attendance</h2></div><div className="page-actions"><label>Attendance date<input type="date" required value={day} disabled={busy} onChange={e => { if (e.target.value) { setDay(e.target.value); setError('') } }} /></label></div></div>
      <div className="table-wrap"><table><thead><tr><th>Teacher</th><th>Department</th><th>Status</th></tr></thead><tbody>
        {attendance.map(row => <tr key={row.teacher_id}><td>{row.full_name}</td><td>{row.department || '—'}</td><td><select className="payroll-status" aria-label={`Attendance for ${row.full_name}`} disabled={disabled} value={row.status} onChange={e => mutate(() => schoolApi.markStaffAttendance({ teacher_id: row.teacher_id, status: e.target.value, attendance_date: day }))}><option value="pending" disabled>Not marked</option><option value="present">Present</option><option value="absent">Absent</option><option value="leave">Leave</option><option value="half_day">Half day</option></select></td></tr>)}
        {loaded && !attendance.length && <tr><td colSpan="3">No active teachers in this school.</td></tr>}
      </tbody></table></div>
    </section>
  </div>
}
