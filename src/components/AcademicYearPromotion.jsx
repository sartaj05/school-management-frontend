import { GraduationCap, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

export default function AcademicYearPromotion() {
  const [years, setYears] = useState([])
  const [form, setForm] = useState({ from_year: '', to_year: '', promotions: [] })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try { const result = await schoolApi.academicYears(); setYears(result.data || []) } catch (requestError) { setError(requestError.message) }
  }
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [])

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.promoteStudents(form); setMessage(`${result.promoted || 0} student(s) promoted.`); await load() } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <section className="data-panel academic-year-promotion"><div className="panel-title"><div><span>Academic year control</span><h2>Promote students</h2></div><GraduationCap /></div><p className="field-help">Promotion requests are sent as a batch so the previous-year enrollment remains available for reports.</p><form className="field-grid" onSubmit={submit}><label>From academic year *<input required value={form.from_year} onChange={event => setForm({ ...form, from_year: event.target.value })} placeholder="2025-2026" /></label><label>To academic year *<input required value={form.to_year} onChange={event => setForm({ ...form, to_year: event.target.value })} placeholder="2026-2027" /></label><label className="wide">Promotion JSON *<textarea required rows="6" value={JSON.stringify(form.promotions, null, 2)} onChange={event => { try { setForm({ ...form, promotions: JSON.parse(event.target.value) }) } catch { /* wait for valid JSON */ } }} placeholder={'[{"student_id":1,"next_class_name":"Grade 9","next_section":"A"}'} /></label><div className="wide field-help">Example: [{'{'}"student_id": 1, "next_class_name": "Grade 9", "next_section": "A"{'}'}]</div>{error && <div className="form-error wide">{error}</div>}{message && <div className="success-notice wide">{message}</div>}<button className="button button-small" disabled={busy}><Save size={16} />{busy ? 'Promoting…' : 'Promote students'}</button></form><div className="field-help">Known academic years: {years.map(year => year.year_label).join(', ') || 'None yet'}</div></section>
}
