import { Save, UserRound } from 'lucide-react'
import { useState } from 'react'
import { schoolApi } from '../lib/api'

export default function ProfileUpdateCard({ profile, onUpdated }) {
  const [values, setValues] = useState({ name: profile?.name || '', mobile: profile?.mobile || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    try {
      const result = await schoolApi.updateProfile(values)
      setSuccess(result.message)
      setValues({ name: result.profile.name || '', mobile: result.profile.mobile || '' })
      onUpdated(result.profile)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <form className="data-panel profile-update-card" onSubmit={submit}><div className="panel-title"><div><span>Editable account details</span><h2>Update my profile</h2></div><UserRound /></div><div className="profile-update-fields"><label>Full name<input required minLength="2" maxLength="100" value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} /></label><label>Mobile number<input inputMode="tel" minLength="7" maxLength="20" value={values.mobile} onChange={event => setValues({ ...values, mobile: event.target.value.replace(/[^0-9+]/g, '') })} placeholder="Optional" /></label><label>Email address<input value={profile?.email || ''} readOnly /></label><label>Role<input value={profile?.role || ''} readOnly /></label></div>{error && <div className="form-error profile-update-message">{error}</div>}{success && <div className="success-notice profile-update-message">{success}</div>}<div className="profile-update-submit"><small>Email and role are protected administrator-managed fields.</small><button className="button button-small" disabled={busy}><Save size={16} />{busy ? 'Saving…' : 'Save profile'}</button></div></form>
}
