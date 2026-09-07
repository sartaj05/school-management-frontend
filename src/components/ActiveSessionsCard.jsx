import { LogOut, MonitorSmartphone, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function ActiveSessionsCard() {
  const [sessions, setSessions] = useState([])
  const [busy, setBusy] = useState(true)
  const [revoking, setRevoking] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setBusy(true); setError('')
    try {
      const result = await schoolApi.sessions()
      setSessions(result.sessions || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [load])

  async function revoke(session) {
    if (!await confirmPopup({ title: 'Sign out this device?', message: `${session.device} will lose refresh access and must sign in again.`, confirmLabel: 'Sign out' })) return
    setRevoking(session.id); setError(''); setMessage('')
    try {
      const result = await schoolApi.revokeSession(session.id)
      setMessage(result.message)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRevoking(null)
    }
  }

  return <section className="data-panel active-sessions-card"><div className="panel-title"><div><span>Account security</span><h2>Active sessions</h2></div><button type="button" className="refresh-button" onClick={load} disabled={busy}><RefreshCw />{busy ? 'Loading…' : 'Refresh'}</button></div>{error && <div className="form-error session-message">{error}</div>}{message && <div className="success-notice session-message">{message}</div>}{busy && sessions.length === 0 ? <div className="session-empty">Loading active devices…</div> : sessions.length === 0 ? <div className="session-empty">No active refresh sessions found.</div> : <div className="session-list">{sessions.map(session => <article key={session.id}><span className="session-icon"><MonitorSmartphone /></span><div><b>{session.device}</b><small>{session.ip_address || 'Unknown IP'} · Signed in {formatDate(session.created_at)}</small><small>Refresh access expires {formatDate(session.expires_at)}</small></div>{session.is_current ? <span className="current-session">This device</span> : <button type="button" onClick={() => revoke(session)} disabled={revoking === session.id}><LogOut />{revoking === session.id ? 'Signing out…' : 'Sign out'}</button>}</article>)}</div>}<p className="session-footnote">Signing out another device revokes its refresh session. Its current access token can remain valid until normal expiry.</p></section>
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'unknown'
}
