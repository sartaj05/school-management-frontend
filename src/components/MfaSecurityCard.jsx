import { useEffect, useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { schoolApi } from '../lib/api'

export default function MfaSecurityCard() {
  const [available] = useState(() => {
    try { return !['Super Admin', 'super_admin', 'superadmin'].includes(JSON.parse(sessionStorage.getItem('school_session') || '{}').role) } catch { return true }
  })
  const [status, setStatus] = useState(null)
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    try { setStatus(await schoolApi.mfaStatus()) } catch (err) { setError(err.message) }
  }

  useEffect(() => {
    if (!available) return undefined
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [available])

  async function startSetup() {
    setBusy(true); setError(''); setSuccess('')
    try { setSetup(await schoolApi.mfaSetup()); setCode('') } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function enable() {
    setBusy(true); setError(''); setSuccess('')
    try { await schoolApi.mfaEnable(code); setSetup(null); setCode(''); setSuccess('Two-factor authentication is enabled.'); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true); setError(''); setSuccess('')
    try { await schoolApi.mfaDisable(code); setCode(''); setSuccess('Two-factor authentication is disabled.'); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (!available) return null
  return <section className="data-panel">
    <div className="panel-title"><div><span>Account security</span><h2><ShieldCheck size={18} /> Two-factor authentication</h2></div></div>
    <p>Protect sign-in with a six-digit code from an authenticator app.</p>
    {!status ? <span>Loading security status...</span> : status.enabled ? <>
      <div className="success-notice">Authenticator protection is enabled.</div>
      <label>Current authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} /></label>
      <button className="button button-small" disabled={busy || code.length !== 6} onClick={disable}><KeyRound size={16} /> Disable MFA</button>
    </> : setup ? <>
      <p><b>Secret:</b> <code>{setup.secret}</code></p>
      <p><small>Add this secret to your authenticator app, then verify one code.</small></p>
      <label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} /></label>
      <button className="button button-small" disabled={busy || code.length !== 6} onClick={enable}><ShieldCheck size={16} /> Enable MFA</button>
    </> : <button className="button button-small" disabled={busy} onClick={startSetup}><ShieldCheck size={16} /> Set up MFA</button>}
    {error && <div className="form-error">{error}</div>}{success && <div className="success-notice">{success}</div>}
  </section>
}
