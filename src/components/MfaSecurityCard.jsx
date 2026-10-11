import { useEffect, useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { schoolApi } from '../lib/api'

export default function MfaSecurityCard() {
  const [available] = useState(() => {
    try { return !['Super Admin', 'super_admin', 'superadmin'].includes(JSON.parse(sessionStorage.getItem('school_session') || '{}').role) } catch { return true }
  })
  const [status, setStatus] = useState(null)
  const [setup, setSetup] = useState(null)
  const [recoveryCodes, setRecoveryCodes] = useState([])
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
    try { const result = await schoolApi.mfaEnable(code); setRecoveryCodes(result.recovery_codes || []); setSetup(null); setCode(''); setSuccess('Two-factor authentication is enabled. Save the one-time recovery codes below.'); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true); setError(''); setSuccess('')
    try { await schoolApi.mfaDisable(code); setCode(''); setSuccess('Two-factor authentication is disabled.'); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function regenerate() {
    setBusy(true); setError(''); setSuccess('')
    try { const result = await schoolApi.mfaRegenerateRecoveryCodes(code); setRecoveryCodes(result.recovery_codes || []); setCode(''); setSuccess('Recovery codes regenerated. The previous codes no longer work.'); await load() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (!available) return null
  return <section className="data-panel">
    <div className="panel-title"><div><span>Account security</span><h2><ShieldCheck size={18} /> Two-factor authentication</h2></div></div>
    <p>Protect sign-in with an authenticator app and one-time recovery codes.</p>
    {!status ? <span>Loading security status...</span> : status.enabled ? <>
      <div className="success-notice">Authenticator protection is enabled.</div>
      <label>Current authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} /></label>
      <button className="button button-small" disabled={busy || code.length !== 6} onClick={regenerate}><KeyRound size={16} /> Regenerate recovery codes</button>
      <button className="button button-small" disabled={busy || code.length !== 6} onClick={disable}><KeyRound size={16} /> Disable MFA</button>
    </> : setup ? <>
      <p><b>Secret:</b> <code>{setup.secret}</code></p>
      <p><small>Add this secret to your authenticator app, then verify one code.</small></p>
      <label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} /></label>
      <button className="button button-small" disabled={busy || code.length !== 6} onClick={enable}><ShieldCheck size={16} /> Enable MFA</button>
    </> : <button className="button button-small" disabled={busy} onClick={startSetup}><ShieldCheck size={16} /> Set up MFA</button>}
    {recoveryCodes.length > 0 && <div className="success-notice"><b>Recovery codes — save them now</b><p>{recoveryCodes.join(' · ')}</p><small>Each code works once and will not be shown again.</small></div>}
    {error && <div className="form-error">{error}</div>}{success && <div className="success-notice">{success}</div>}
  </section>
}
