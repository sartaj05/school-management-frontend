import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, School } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { schoolApi } from '../lib/api'

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [superAdmin, setSuperAdmin] = useState(false)
  const [mode, setMode] = useState('login')
  const [show, setShow] = useState(false)
  const [schools, setSchools] = useState([])
  const [schoolDisplay, setSchoolDisplay] = useState('')
  const [form, setForm] = useState({ email: '', password: '', school_domain: '', token: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (superAdmin) return
    schoolApi.schools().then((data) => setSchools(data.schools || [])).catch(() => setSchools([]))
  }, [superAdmin])

  useEffect(() => {
    const selected = schools.find((school) => school.domain === form.school_domain)
    setSchoolDisplay(selected ? selected.schoolName : form.school_domain)
  }, [schools, form.school_domain])
  const change = e => setForm({ ...form, [e.target.name]: e.target.value })
  const switchMode = next => { setMode(next); setError(''); setMessage('') }

  async function submitLogin(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const data = superAdmin ? await schoolApi.superAdminLogin({ email: form.email, password: form.password }) : await schoolApi.schoolLogin(form)
      onLogin(data); navigate('/dashboard')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function requestReset(e) {
    e.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      const data = await schoolApi.forgotPassword({ email: form.email, school_domain: form.school_domain })
      setMessage(data.message)
      if (data.reset_token) setForm(current => ({ ...current, token: data.reset_token }))
      setMode('reset')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function resetPassword(e) {
    e.preventDefault(); setError(''); setMessage('')
    if (form.new_password !== form.confirm_password) { setError('New password and confirmation do not match.'); return }
    setBusy(true)
    try {
      const data = await schoolApi.resetPassword({ token: form.token, new_password: form.new_password })
      setMessage(data.message); setMode('login')
      setForm(current => ({ ...current, password: '', token: '', new_password: '', confirm_password: '' }))
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <main className="login-page"><section className="login-aside"><Link to="/"><Logo light /></Link><div><span className="eyebrow eyebrow-dark">Built for better school days</span><h1>Welcome back to your school community.</h1><p>One secure place for your people, classes and daily progress.</p></div><small>Simple. Connected. Thoughtful.</small></section><section className="login-panel"><div className="login-box"><Link className="back-link" to="/"><ArrowLeft size={17} /> Back to home</Link><div className="login-heading"><span className="login-icon">{mode === 'login' ? <LockKeyhole /> : <KeyRound />}</span><h2>{mode === 'login' ? 'Sign in to EduFlow' : mode === 'forgot' ? 'Forgot password' : 'Reset password'}</h2><p>{mode === 'login' ? 'Use the details provided by your school.' : mode === 'forgot' ? 'Request a secure, 15-minute reset token.' : 'Enter the token sent to your email.'}</p></div>{mode === 'login' && <><div className="login-tabs"><button className={!superAdmin ? 'active' : ''} onClick={() => setSuperAdmin(false)}>School user</button><button className={superAdmin ? 'active' : ''} onClick={() => setSuperAdmin(true)}>Super admin</button></div><form onSubmit={submitLogin} className="form-stack">{!superAdmin && <DomainField form={form} change={change} schools={schools} setForm={setForm} schoolDisplay={schoolDisplay} setSchoolDisplay={setSchoolDisplay} />}<EmailField form={form} change={change} /><PasswordField name="password" label="Password" value={form.password} change={change} show={show} setShow={setShow} />{message && <div className="success-notice login-message">{message}</div>}{error && <div className="form-error">{error}</div>}<button className="button button-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>{!superAdmin && <button type="button" className="text-action" onClick={() => switchMode('forgot')}>Forgot your password?</button>}</form></>}{mode === 'forgot' && <form onSubmit={requestReset} className="form-stack"><DomainField form={form} change={change} schools={schools} setForm={setForm} schoolDisplay={schoolDisplay} setSchoolDisplay={setSchoolDisplay} /><EmailField form={form} change={change} />{error && <div className="form-error">{error}</div>}<button className="button button-full" disabled={busy}>{busy ? 'Requesting…' : 'Send reset instructions'}</button><button type="button" className="text-action" onClick={() => switchMode('login')}>Back to sign in</button></form>}{mode === 'reset' && <form onSubmit={resetPassword} className="form-stack">{message && <div className="success-notice login-message">{message}</div>}<label>Reset token<div className="input-wrap"><KeyRound /><input name="token" value={form.token} onChange={change} required autoComplete="one-time-code" /></div></label><PasswordField name="new_password" label="New password" value={form.new_password} change={change} show={show} setShow={setShow} minLength={8} /><PasswordField name="confirm_password" label="Confirm new password" value={form.confirm_password} change={change} show={show} setShow={setShow} minLength={8} />{error && <div className="form-error">{error}</div>}<button className="button button-full" disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</button><button type="button" className="text-action" onClick={() => switchMode('forgot')}>Request another token</button></form>}<p className="login-help">Need access? Contact your school administrator.</p></div></section></main>
}

function DomainField({ form, change, schools, setForm, schoolDisplay, setSchoolDisplay }) {
  const handleSchoolPick = (value) => {
    const trimmed = value.trim()
    const match = schools.find((school) => {
      const schoolName = (school.schoolName || '').toLowerCase()
      const domain = (school.domain || '').toLowerCase()
      const combined = `${school.schoolName} (${school.domain})`.toLowerCase()
      return schoolName === trimmed.toLowerCase() || domain === trimmed.toLowerCase() || combined === trimmed.toLowerCase()
    })

    setSchoolDisplay(match ? match.schoolName : trimmed)
    setForm((current) => ({ ...current, school_domain: match ? match.domain : trimmed }))
  }

  return (
    <label>
      School name
      <div className="input-wrap">
        <School />
        <input
          list="school-domain-options"
          name="school_domain"
          value={schoolDisplay}
          onChange={(event) => handleSchoolPick(event.target.value)}
          placeholder="Search school name"
          required
        />
      </div>
      <datalist id="school-domain-options">
        {schools.map((school) => (
          <option key={school.id} value={school.schoolName} />
        ))}
      </datalist>
    </label>
  )
}
function EmailField({ form, change }) { return <label>Email address<div className="input-wrap"><Mail /><input type="email" name="email" value={form.email} onChange={change} placeholder="name@school.com" required /></div></label> }
function PasswordField({ name, label, value, change, show, setShow, minLength }) { return <label>{label}<div className="input-wrap"><LockKeyhole /><input type={show ? 'text' : 'password'} name={name} value={value} onChange={change} required minLength={minLength} autoComplete={name === 'password' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label> }
