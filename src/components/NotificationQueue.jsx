import { BarChart3, BellRing, Clock3, Play, RefreshCw, RotateCcw, Send, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const nowLocal = () => {
  const value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  return value.toISOString().slice(0, 16)
}
export default function NotificationQueue({ user }) {
  const [form, setForm] = useState({ template_key: '', title: '', message: '', channel: 'portal', phone_number: '', email_address: '', target_role: 'parent', target_user_id: '', scheduled_for: nowLocal(), max_attempts: 3 })
  const [templates, setTemplates] = useState([])
  const [recipients, setRecipients] = useState([])
  const [queue, setQueue] = useState({ data: [], counts: {}, pagination: {} })
  const [analytics, setAnalytics] = useState(null)
  const [runs, setRuns] = useState([])
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const isAdmin = user.role === 'School Admin'

  async function load(page = 1, selectedStatus = status) {
    setBusy(true); setError('')
    try {
      const requests = [schoolApi.notificationQueue(selectedStatus, page), schoolApi.notificationTemplates(), schoolApi.notificationRecipients()]
      if (isAdmin) requests.push(schoolApi.notificationAnalytics(30))
      if (isAdmin) requests.push(schoolApi.notificationRunHistory())
      const [nextQueue, nextTemplates, nextRecipients, nextAnalytics, nextRuns] = await Promise.all(requests)
      setQueue(nextQueue)
      setTemplates(nextTemplates?.data || [])
      setRecipients(nextRecipients?.data || [])
      if (isAdmin) setAnalytics(nextAnalytics)
      if (isAdmin) setRuns(nextRuns?.data || [])
    }
    catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  useEffect(() => { const timer = setTimeout(() => load(1, 'all'), 0); return () => clearTimeout(timer) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))
  const matchingRecipients = recipients.filter(item => !form.target_role || `${item.role || ''}`.toLowerCase() === form.target_role.toLowerCase())
  function selectRecipient(value) {
    const recipient = recipients.find(item => `${item.id}` === value)
    setForm(current => ({ ...current, target_user_id: value, phone_number: recipient?.mobile || current.phone_number, email_address: recipient?.email || current.email_address }))
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const payload = { ...form, scheduled_for: new Date(form.scheduled_for).toISOString(), max_attempts: Number(form.max_attempts), target_user_id: form.target_user_id ? Number(form.target_user_id) : undefined }
      if (!payload.template_key) delete payload.template_key
      if (payload.channel !== 'whatsapp') delete payload.phone_number
      if (payload.channel !== 'email') delete payload.email_address
      const result = await schoolApi.queueNotification(payload)
      setMessage(result.message); setForm(current => ({ ...current, template_key: '', title: '', message: '', phone_number: '', email_address: '', target_user_id: '', scheduled_for: nowLocal() })); await load()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function processDue() {
    setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.processNotificationQueue(); const summary = result.summary; setMessage(`Processed ${summary.selected}: ${summary.sent} sent, ${summary.retrying} retrying, ${summary.failed} failed.`); await load() }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function generateAlerts() {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.runAutomatedAlerts()
      const summary = result.summary || {}
      setMessage(`Generated ${summary.attendance_alerts || 0} attendance alert(s) and ${summary.fee_alerts || 0} fee alert(s).`)
      await load()
    }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function retry(row) {
    if (!await confirmPopup({ title: `Retry “${row.title}”?`, message: 'Attempts will reset and the message will become immediately available to the worker.', confirmLabel: 'Queue retry', tone: 'primary' })) return
    setBusy(true); setError(''); try { const result = await schoolApi.retryNotification(row.id); setMessage(result.message); await load() } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function cancel(row) {
    if (!await confirmPopup({ title: `Cancel “${row.title}”?`, message: 'The queue worker will no longer send this message.', confirmLabel: 'Cancel message' })) return
    setBusy(true); setError(''); try { const result = await schoolApi.cancelNotification(row.id); setMessage(result.message); await load() } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  function changeStatus(value) { setStatus(value); load(1, value) }
  const pages = queue.pagination || {}

  return <section className="notification-queue-section">
    <div className="queue-heading"><div><span>Reliable delivery</span><h2>Schedule and retry queue</h2><p>Use templates to send a tracked school alert through the right channel.</p></div>{isAdmin && <div className="queue-heading-actions"><button className="button button-small button-ghost" onClick={generateAlerts} disabled={busy}><BellRing />Generate alerts</button><button className="button button-small" onClick={processDue} disabled={busy}><Play />Process due now</button></div>}</div>
    <form className="editor-card queue-form" onSubmit={submit}><div className="field-grid three"><label>Template<select value={form.template_key} onChange={e => { const key = e.target.value; const selected = templates.find(item => item.template_key === key); setForm(current => ({ ...current, template_key: key, title: selected?.title || current.title, message: selected?.message || current.message, channel: selected?.channel || current.channel })) }}><option value="">Custom message</option>{templates.map(template => <option key={template.template_key} value={template.template_key}>{template.name}</option>)}</select><small className="field-help">Templates support variables such as {'{{student_name}}'}.</small></label><label>Channel<select value={form.channel} onChange={e => field('channel', e.target.value)}><option value="portal">Portal inbox</option><option value="push">Firebase push</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></label><label>Target role<select value={form.target_role} onChange={e => setForm(current => ({ ...current, target_role: e.target.value, target_user_id: '' }))}><option value="parent">Parent</option><option value="student">Student</option><option value="teacher">Teacher</option></select></label><label className="wide">Recipient user<select value={`${form.target_user_id || ''}`} onChange={e => selectRecipient(e.target.value)} required={form.channel === 'portal' || form.channel === 'push'}><option value="">Choose a school user</option>{matchingRecipients.map(item => <option key={item.id} value={item.id}>{item.name} · {item.role} · {item.email}</option>)}</select><small className="field-help">Search results are limited to active users in this school.</small></label><label>Title *<input required maxLength="150" value={form.title} onChange={e => field('title', e.target.value)} /></label>{form.channel === 'whatsapp' && <label>Recipient phone *<input required value={form.phone_number} onChange={e => field('phone_number', e.target.value.replace(/[^0-9+]/g, ''))} placeholder="919876543210" /></label>}{form.channel === 'email' && <label>Recipient email *<input required type="email" value={form.email_address} onChange={e => field('email_address', e.target.value)} placeholder="parent@example.com" /></label>}<label>Schedule date and time *<input required type="datetime-local" value={form.scheduled_for} onChange={e => field('scheduled_for', e.target.value)} /></label><label>Maximum attempts<input type="number" min="1" max="10" value={form.max_attempts} onChange={e => field('max_attempts', e.target.value)} /></label><label className="wide">Message *<textarea required rows="3" value={form.message} onChange={e => field('message', e.target.value)} /></label></div><button className="button button-small" disabled={busy}><Clock3 />{busy ? 'Saving…' : 'Schedule notification'}</button></form>
    {error && <div className="form-error queue-message">{error}</div>}{message && <div className="success-notice queue-message">{message}</div>}
    {isAdmin && analytics?.data && <section className="notification-analytics">
      <div className="queue-heading"><div><span>Campaign delivery</span><h3>Last {analytics.data.window_days || 30} days</h3></div><BarChart3 /></div>
      <div className="stat-grid compact">
        <article><small>Total alerts</small><b>{analytics.data.total || 0}</b><span>all campaign types</span></article>
        <article><small>Delivered</small><b>{analytics.data.sent || 0}</b><span>{analytics.data.delivery_rate || 0}% delivery rate</span></article>
        <article><small>Attendance</small><b>{analytics.data.attendance_alerts || 0}</b><span>absent and late</span></article>
        <article><small>Fees</small><b>{analytics.data.fee_alerts || 0}</b><span>due and overdue</span></article>
        <article><small>Failed</small><b>{analytics.data.failed || 0}</b><span>available for retry</span></article>
      </div>
    </section>}
    {isAdmin && <section className="data-panel notification-run-history"><div className="panel-title"><div><span>Worker operations</span><h3>Recent background runs</h3></div><b>{runs.length} runs</b></div><div className="table-wrap"><table><thead><tr><th>Started</th><th>Status</th><th>Selected</th><th>Sent</th><th>Retrying</th><th>Failed</th></tr></thead><tbody>{runs.slice(0, 5).map(run => <tr key={run.id}><td>{run.started_at ? new Date(run.started_at).toLocaleString() : '—'}</td><td><span className={`delivery-status ${run.status}`}>{run.status}</span></td><td>{run.selected || 0}</td><td>{run.sent || 0}</td><td>{run.retrying || 0}</td><td>{run.failed || 0}</td></tr>)}</tbody></table></div>{runs.length === 0 && <div className="empty-state"><Clock3 /><h3>No worker runs yet</h3><p>Use the protected cron endpoint or Process due now.</p></div>}</section>}
    <div className="queue-toolbar"><div>{['all','queued','retrying','sent','failed','cancelled'].map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => changeStatus(value)}>{value}<span>{value === 'all' ? Object.values(queue.counts || {}).reduce((sum, count) => sum + count, 0) : queue.counts?.[value] || 0}</span></button>)}</div><button className="refresh-button" onClick={() => load()} disabled={busy}><RefreshCw />Refresh</button></div>
    <section className="data-panel queue-table"><div className="table-wrap"><table><thead><tr><th>Message</th><th>Recipient</th><th>Schedule</th><th>Attempts</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead><tbody>{queue.data.map(row => <tr key={row.id}><td><b>{row.title}</b><small>{row.message}</small>{row.last_error && <em>{row.last_error}</em>}</td><td>{row.phone_number}<small>{row.target_role || '—'} · {row.channel}</small>{row.target_user_id && <small>Inbox user #{row.target_user_id}</small>}</td><td>{row.scheduled_for ? new Date(row.scheduled_for).toLocaleString() : 'Now'}{row.next_attempt_at && <small>Next: {new Date(row.next_attempt_at).toLocaleString()}</small>}</td><td>{row.attempt_count}/{row.max_attempts}</td><td><span className={`delivery-status ${row.status}`}>{row.status}</span></td>{isAdmin && <td><div className="student-row-actions">{['failed','retrying'].includes(row.status) && <button onClick={() => retry(row)} disabled={busy}><RotateCcw />Retry</button>}{['queued','retrying'].includes(row.status) && <button className="danger" onClick={() => cancel(row)} disabled={busy}><XCircle />Cancel</button>}</div></td>}</tr>)}</tbody></table></div>{queue.data.length === 0 && <div className="empty-state"><Send /><h3>No queue records</h3><p>Schedule a message or change the status filter.</p></div>}{pages.pages > 1 && <div className="report-pagination"><button disabled={busy || pages.page <= 1} onClick={() => load(pages.page - 1)}>Previous</button><span>Page {pages.page} of {pages.pages}</span><button disabled={busy || pages.page >= pages.pages} onClick={() => load(pages.page + 1)}>Next</button></div>}</section>
  </section>
}
