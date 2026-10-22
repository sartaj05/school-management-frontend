import { useEffect, useState } from 'react'
import SubscriptionHistory from './SubscriptionHistory'
import { schoolApi } from '../lib/api'
import { subscriptionForm, subscriptionPayload, subscriptionStatuses } from '../lib/subscription'

export default function SchoolSubscriptionEditor({ schoolId, onSaved }) {
  const [subscription, setSubscription] = useState(null)
  const [values, setValues] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    let active = true
    schoolApi.schoolSubscription(schoolId).then(result => {
      if (active) { setSubscription(result.subscription); setValues(subscriptionForm(result.subscription)) }
    }).catch(error => { if (active) setError(error.message) })
    return () => { active = false }
  }, [schoolId])
  const change = event => setValues(current => ({ ...current, [event.target.name]: event.target.value }))
  async function save(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try {
      const result = await schoolApi.updateSchoolSubscription(schoolId, subscriptionPayload(values))
      setSubscription(result.subscription); setValues(subscriptionForm(result.subscription))
      setNotice('Subscription updated.'); onSaved?.()
    } catch (error) { setError(error.message) } finally { setBusy(false) }
  }
  return <section className="editor-card">
    <h3>School subscription</h3>
    <p>Subscription access is separate from school activation. Dates below use UTC.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {!values ? <p>{error ? 'Close and reopen this school to retry.' : 'Loading subscription…'}</p> : <form onSubmit={save}>
      <p>Effective status: <strong>{subscription.effective_status}</strong> · Workspace access: <strong>{subscription.access_enabled ? 'Enabled' : 'Disabled'}</strong></p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0 }}><div className="field-grid">
        <label>Subscription plan<select name="plan" value={values.plan} onChange={change}>{['standard', 'trial', 'premium', 'enterprise'].map(plan => <option key={plan}>{plan}</option>)}</select></label>
        <label>Subscription status<select name="status" value={values.status} onChange={change}>{subscriptionStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
        <label>Trial expiry (UTC)<input type="datetime-local" name="trial_ends_at" value={values.trial_ends_at} onChange={change}/></label>
        <label>Plan expiry (UTC)<input type="datetime-local" name="plan_ends_at" value={values.plan_ends_at} onChange={change}/></label>
        <label>Change reason<input required maxLength={255} name="reason" value={values.reason} onChange={change}/></label>
      </div><p>Clear an expiry field to remove that date. To reactivate an expired subscription, choose active and set a future plan expiry or clear it.</p>
      <button className="button button-small" type="submit">{busy ? 'Saving…' : 'Save subscription'}</button></fieldset>
    </form>}
    <SubscriptionHistory key={`${schoolId}-${subscription?.changed_at}`} schoolId={schoolId}/>
  </section>
}
