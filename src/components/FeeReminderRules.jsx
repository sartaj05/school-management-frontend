import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function FeeReminderRules() {
  const [settings, setSettings] = useState(null), [offsets, setOffsets] = useState(''), [rows, setRows] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  async function request(method = 'GET') {
    setBusy(true)
    try {
      const result = await api('/fees/reminder-policy', { method, ...(method === 'PUT' ? { body: JSON.stringify({ ...settings, offsets: offsets.split(',').map(n => Number(n.trim())) }) } : {}) })
      setSettings(result.settings); setOffsets(result.settings.offsets.join(', ')); setRows(result.deliveries || [])
      setMessage(method === 'POST' ? `${result.run.queued} reminders queued. ${result.run.skipped_preferences} skipped by preference; ${result.run.missing_contacts} missing contacts. The delivery worker sends queued reminders.` : method === 'PUT' ? 'Reminder rules saved.' : '')
    } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  useEffect(() => { const timer = setTimeout(() => request(), 0); return () => clearTimeout(timer) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const update = (key, value) => setSettings(s => ({ ...s, [key]: value }))
  return <section className="data-panel"><h2>Automatic fee reminders</h2><p>Negative days are before the due date; 0 is the due date. Saved parent preferences take priority. Payments under verification are excluded.</p>
    {message && <p role="status">{message}</p>}
    {settings && <form onSubmit={e => { e.preventDefault(); request('PUT') }}><div className="form-grid">
      <label><input type="checkbox" checked={settings.enabled} onChange={e => update('enabled', e.target.checked)} /> Enable automatic reminders</label>
      <label>Days relative to due date<input required value={offsets} pattern="-?\d+(\s*,\s*-?\d+)*" onChange={e => setOffsets(e.target.value)} placeholder="-3, 0, 3, 7" /></label>
      <label>Delivery hour (0–23)<input type="number" min="0" max="23" required value={settings.hour} onChange={e => update('hour', Number(e.target.value))} /></label>
      <label>Timezone<input required value={settings.timezone} onChange={e => update('timezone', e.target.value)} /></label>
      <label>Default channel<select value={settings.channel} onChange={e => update('channel', e.target.value)}>{['portal', 'email', 'whatsapp', 'push'].map(c => <option key={c}>{c}</option>)}</select></label>
    </div><button disabled={busy} className="button" type="submit">Save reminder rules</button></form>}
    <button disabled={busy || !settings?.enabled} onClick={() => request('POST')}>Queue reminders due now</button> <button disabled={busy} onClick={() => request()}>Refresh delivery status</button>
    <p>Automatic delivery requires the school job scheduler and the selected messaging provider to be configured.</p>
    <div className="table-wrap"><table><caption>Latest 50 automatic reminders</caption><thead><tr><th>Created</th><th>Channel</th><th>Status</th><th>Attempts / error</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.created_at}</td><td>{r.channel}</td><td>{r.status}</td><td>{r.attempt_count} {r.last_error}</td></tr>)}</tbody></table></div>
  </section>
}
