/* eslint-disable react-hooks/set-state-in-effect */
import { GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const statuses = ['submitted', 'under_review', 'approved', 'rejected', 'enrolled']

export default function AdmissionManagement() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('all')
  const [section, setSection] = useState('A')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await schoolApi.admissionApplications(status)
      setRows(result.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Reload when the status filter changes; load reads the selected status.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [status])

  async function save(row, nextStatus) {
    if (nextStatus === 'enrolled' && row.status !== 'enrolled' && !await confirmPopup({
      title: `Enroll ${row.student_first_name} ${row.student_last_name || ''}?`,
      message: `This creates an active student record, a guardian record, and assigns the student to ${row.applying_class} / section ${section}. It is available on Free, Standard and Trial schools.`,
      confirmLabel: 'Enroll student',
      tone: 'primary',
    })) return

    try {
      const result = await schoolApi.updateAdmissionApplication(row.id, { status: nextStatus, admin_notes: row.admin_notes || '', section })
      setNotice(result.message)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return <>
    <section className="people-hero"><div><span>School admissions</span><h2>Review and enroll applications</h2><p>Approve, reject, or enroll applicants. Enrollment creates the student and guardian records automatically.</p></div><GraduationCap /></section>
    <div className="page-actions"><p>{rows.length} applications</p><label>Enrollment section<input value={section} maxLength="20" onChange={e => setSection(e.target.value)} /></label><select value={status} onChange={e => setStatus(e.target.value)}>{statuses.concat('all').map(s => <option key={s} value={s}>{s}</option>)}</select></div>
    {error && <div className="form-error">{error}</div>}{notice && <div className="success-notice">{notice}</div>}
    {busy ? <div className="loading-grid"><i /><i /><i /></div> : <section className="data-panel"><div className="table-wrap"><table><thead><tr><th>Application</th><th>Student</th><th>Class</th><th>Guardian</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.application_no}</b><small>{new Date(row.created_at).toLocaleDateString()}</small></td><td>{row.student_first_name} {row.student_last_name || ''}</td><td>{row.applying_class}<small>{row.enrolled_student_id ? 'Enrollment completed' : `Section ${section} on enrollment`}</small></td><td>{row.guardian_name}<small>{row.guardian_mobile}</small></td><td><span className="status-pill">{row.status}</span></td><td><select value={row.status} onChange={e => save(row, e.target.value)}>{statuses.map(s => <option key={s} value={s}>{s === 'enrolled' ? 'enrolled (creates records)' : s}</option>)}</select></td></tr>)}</tbody></table></div></section>}
  </>
}
