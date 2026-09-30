import { CheckCircle2, Search, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import PublicLayout from '../components/PublicLayout'
import { schoolApi } from '../lib/api'
import { translateUi } from '../lib/i18n'

const phoneValue = value => {
  const digits = String(value || '').replace(/\D/g, '')
  const normalized = digits.startsWith('91') ? digits.slice(0, 12) : '91' + digits.slice(0, 10)
  return normalized.length <= 2 ? '+91' : '+' + normalized
}
const phoneOk = value => /^\+91[6-9]\d{9}$/.test(value || '')
const emailOk = value => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value || '')

export default function AdmissionPage({ language = 'en' }) {
  const [schools, setSchools] = useState([])
  const [values, setValues] = useState({
    school_domain: '', student_first_name: '', student_last_name: '', gender: '', dob: '',
    applying_class: '', previous_school: '', address: '', guardian_name: '',
    guardian_relation: 'guardian', guardian_mobile: '+91', guardian_email: '', source: 'website',
  })
  const [trackValues, setTrackValues] = useState({ school_domain: '', application_no: '', guardian_mobile: '+91' })
  const [busy, setBusy] = useState(false)
  const [trackBusy, setTrackBusy] = useState(false)
  const [error, setError] = useState('')
  const [trackError, setTrackError] = useState('')
  const [done, setDone] = useState(null)
  const [tracked, setTracked] = useState(null)

  useEffect(() => {
    schoolApi.schools().then(data => setSchools(data.schools || [])).catch(e => setError(e.message))
  }, [])

  const t = value => translateUi(language, value)
  const field = (key, value) => setValues({ ...values, [key]: key === 'guardian_mobile' ? phoneValue(value) : value })
  const trackField = (key, value) => setTrackValues({ ...trackValues, [key]: key === 'guardian_mobile' ? phoneValue(value) : value })

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      setDone(await schoolApi.submitAdmission(values))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function checkStatus(event) {
    event.preventDefault()
    setTrackBusy(true)
    setTrackError('')
    setTracked(null)
    try {
      const result = await schoolApi.admissionPublicStatus(trackValues)
      setTracked(result.data)
    } catch (requestError) {
      setTrackError(requestError.message)
    } finally {
      setTrackBusy(false)
    }
  }

  return <PublicLayout language={language}><main className="admission-page container">
    <section className="admission-hero"><span>{t('Online admissions')}</span><h1>{t("Start your child's school journey.")}</h1><p>{t('Submit an application directly to your selected school. The school will review it and contact you.')}</p></section>
    {done ? <section className="admission-success"><CheckCircle2 /><div><h2>{t('Application received')}</h2><p>{done.message}</p><b>{t('Application number:')} {done.application_no}</b><small>{done.school_name}</small></div></section> : <form className="editor-card admission-form" onSubmit={submit}>
      <div className="editor-heading"><Send /><div><h3>{t('Admission application')}</h3><p>{t('Fields marked with * are required.')}</p></div></div>
      <div className="field-grid three">
        <label>{t('School')} *<select required value={values.school_domain} onChange={e => field('school_domain', e.target.value)}><option value="">{t('Select school')}</option>{schools.map(s => <option key={s.id} value={s.domain}>{s.schoolName}</option>)}</select></label>
        <label>{t('Applying class')} *<input required value={values.applying_class} onChange={e => field('applying_class', e.target.value)} placeholder="Grade 1" /></label>
        <label>{t('How did you hear about us?')}<select value={values.source} onChange={e => field('source', e.target.value)}><option value="website">{t('Website')}</option><option value="walk_in">{t('Walk in')}</option><option value="referral">{t('Referral')}</option><option value="phone">{t('Phone')}</option><option value="social">{t('Social media')}</option><option value="other">{t('Other')}</option></select></label>
        <label>{t('Student first name')} *<input required value={values.student_first_name} onChange={e => field('student_first_name', e.target.value)} /></label>
        <label>{t('Student last name')}<input value={values.student_last_name} onChange={e => field('student_last_name', e.target.value)} /></label>
        <label>{t('Gender')}<select value={values.gender} onChange={e => field('gender', e.target.value)}><option value="">{t('Select')}</option><option>{t('Male')}</option><option>{t('Female')}</option><option>{t('Other')}</option></select></label>
        <label>{t('Date of birth')}<input type="date" value={values.dob} onChange={e => field('dob', e.target.value)} /></label>
        <label>{t('Guardian name')} *<input required value={values.guardian_name} onChange={e => field('guardian_name', e.target.value)} /></label>
        <label>{t('Relationship')}<select value={values.guardian_relation} onChange={e => field('guardian_relation', e.target.value)}><option value="father">{t('Father')}</option><option value="mother">{t('Mother')}</option><option value="guardian">{t('Guardian')}</option><option value="other">{t('Other')}</option></select></label>
        <label>{t('Guardian mobile')} *<input required value={values.guardian_mobile} onChange={e => field('guardian_mobile', e.target.value)} /></label>
        <label>{t('Guardian email')}<input type="email" value={values.guardian_email} onChange={e => field('guardian_email', e.target.value)} /></label>
        {values.guardian_mobile && values.guardian_mobile !== '+91' && !phoneOk(values.guardian_mobile) && <div className="form-error">{t('Enter a valid Indian mobile number.')}</div>}
        {values.guardian_email && !emailOk(values.guardian_email) && <div className="form-error">{t('Enter a valid email address.')}</div>}
        <label>{t('Previous school')}<input value={values.previous_school} onChange={e => field('previous_school', e.target.value)} /></label>
        <label className="wide">{t('Address')}<textarea rows="3" value={values.address} onChange={e => field('address', e.target.value)} /></label>
      </div>
      {error && <div className="form-error">{error}</div>}
      <button className="button" disabled={busy}><Send size={17} />{busy ? t('Submitting...') : t('Submit application')}</button>
    </form>}

    <section className="editor-card admission-status-tracker">
      <div className="editor-heading"><Search /><div><h3>{t('Check application status')}</h3><p>{t('Use your application number and guardian mobile to see the latest decision.')}</p></div></div>
      <form className="field-grid three" onSubmit={checkStatus}>
        <label>{t('School')} *<select required value={trackValues.school_domain} onChange={e => trackField('school_domain', e.target.value)}><option value="">{t('Select school')}</option>{schools.map(s => <option key={s.id} value={s.domain}>{s.schoolName}</option>)}</select></label>
        <label>{t('Application number')} *<input required value={trackValues.application_no} onChange={e => trackField('application_no', e.target.value.toUpperCase())} placeholder="ADM-1234ABCD" /></label>
        <label>{t('Guardian mobile')} *<input required value={trackValues.guardian_mobile} onChange={e => trackField('guardian_mobile', e.target.value)} /></label>
        <div><button className="button button-small" disabled={trackBusy}><Search size={16} />{trackBusy ? t('Checking...') : t('Check status')}</button></div>
      </form>
      {trackError && <div className="form-error">{trackError}</div>}
      {tracked && <div className="admission-status-result"><b>{tracked.student_first_name} {tracked.student_last_name || ''}</b><span>{tracked.school_name} · {tracked.applying_class}</span><strong>{String(tracked.status || '').replaceAll('_', ' ')}</strong><small>{t('Application number:')} {tracked.application_no}</small></div>}
    </section>
  </main></PublicLayout>
}
