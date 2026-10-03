import { BellRing, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const DEFAULTS = {
  enabled: true,
  attendance_alerts: true,
  fee_alerts: true,
  channel: 'whatsapp',
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(DEFAULTS)
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    schoolApi.notificationPreferences()
      .then(result => {
        if (active) setPreferences({ ...DEFAULTS, ...(result.data || {}) })
      })
      .catch(requestError => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])

  function update(name, value) {
    setPreferences(current => ({ ...current, [name]: value }))
    setNotice('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await schoolApi.saveNotificationPreferences(preferences)
      setPreferences(current => ({ ...current, ...(result.data || {}) }))
      setNotice(result.message || 'Notification preferences saved.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <section className="data-panel notification-preferences">
    <div className="panel-title"><div><span>Personal delivery settings</span><h2>Automated alert preferences</h2></div><BellRing /></div>
    <p className="field-help">Choose whether attendance and fee alerts are generated for your account and which delivery channel should be preferred.</p>
    {busy ? <div className="history-loading">Loading notification preferences…</div> : <form className="field-grid three" onSubmit={save}>
      <label className="accessibility-check"><input type="checkbox" checked={preferences.enabled} onChange={event => update('enabled', event.target.checked)} />Receive automated alerts</label>
      <label className="accessibility-check"><input type="checkbox" checked={preferences.attendance_alerts} onChange={event => update('attendance_alerts', event.target.checked)} />Attendance alerts</label>
      <label className="accessibility-check"><input type="checkbox" checked={preferences.fee_alerts} onChange={event => update('fee_alerts', event.target.checked)} />Fee due and overdue alerts</label>
      <label>Preferred delivery channel<select value={preferences.channel} onChange={event => update('channel', event.target.value)}><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="push">Mobile push</option><option value="portal">Portal inbox</option></select></label>
      <div className="page-actions"><button className="button button-small" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save preferences'}</button></div>
    </form>}
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="success-notice" role="status">{notice}</div>}
  </section>
}
