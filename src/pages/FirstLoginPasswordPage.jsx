import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { schoolApi } from '../lib/api'

export default function FirstLoginPasswordPage({ onComplete, onLogout }) {
  const navigate = useNavigate()
  const [values, setValues] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = event => setValues(current => ({ ...current, [event.target.name]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (values.new_password !== values.confirm_password) {
      setError('New password and confirmation do not match.')
      return
    }
    setBusy(true)
    try {
      await schoolApi.changePassword(values)
      onComplete()
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-page"><section className="login-aside"><Link to="/"><Logo light /></Link><div><span className="eyebrow eyebrow-dark">Account security</span><h1>Set your new password</h1><p>Your administrator created this account. Update the temporary password before entering the school workspace.</p></div><small>Your account is protected.</small></section><section className="login-panel"><div className="login-box"><Link className="back-link" to="/"><ArrowLeft size={17} /> Back home</Link><div className="login-heading"><span className="login-icon"><LockKeyhole /></span><h2>Change password</h2><p>Enter your current password and choose a new password of at least 8 characters.</p></div><form onSubmit={submit} className="form-stack"><label>Current password<div className="input-wrap"><LockKeyhole /><input required type={show ? 'text' : 'password'} name="current_password" value={values.current_password} onChange={change} autoComplete="current-password" /></div></label><label>New password<div className="input-wrap"><LockKeyhole /><input required minLength="8" type={show ? 'text' : 'password'} name="new_password" value={values.new_password} onChange={change} autoComplete="new-password" /></div></label><label>Confirm new password<div className="input-wrap"><LockKeyhole /><input required minLength="8" type={show ? 'text' : 'password'} name="confirm_password" value={values.confirm_password} onChange={change} autoComplete="new-password" /><button type="button" onClick={() => setShow(current => !current)} aria-label={show ? 'Hide passwords' : 'Show passwords'}>{show ? <EyeOff /> : <Eye />}</button></div></label>{error && <div className="form-error">{error}</div>}<button className="button button-full" disabled={busy}>{busy ? 'Updating…' : 'Save new password'}</button><button type="button" className="text-action" onClick={onLogout}>Sign out</button></form></div></section></main>
}
