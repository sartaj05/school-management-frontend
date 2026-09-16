import { Clock3, Play, RefreshCw, RotateCcw, Send, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

const nowLocal = () => {
  const value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  return value.toISOString().slice(0, 16)
}
export default function NotificationQueue({ user }) {
  const [form, setForm] = useState({ title: '', message: '', phone_number: '', target_role: 'parent', target_user_id: '', scheduled_for: nowLocal(), max_attempts: 3 })
  const [queue, setQueue] = useState({ data: [], counts: {}, pagination: {} })
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const isAdmin = user.role === 'School Admin'

  async function load(page = 1, selectedStatus = status) {
    setBusy(true); setError('')
    try { setQueue(await schoolApi.notificationQueue(selectedStatus, page)) }
    catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  useEffect(() => { const timer = setTimeout(() => load(1, 'all'), 0); return () => clearTimeout(timer) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const result = await schoolApi.queueNotification({ ...form, scheduled_for: new Date(form.scheduled_for).toISOString(), max_attempts: Number(form.max_attempts) })
      setMessage(result.message); setForm(current => ({ ...current, title: '', message: '', phone_number: '', target_user_id: '', scheduled_for: nowLocal() })); await load()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function processDue() {
    setBusy(true); setError(''); setMessage('')
    try { const result = await schoolApi.processNotificationQueue(); const summary = result.summary; setMessage(`Processed ${summary.selected}: ${summary.sent} sent, ${summary.retrying} retrying, ${summary.failed} failed.`); await load() }
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
    <div className="queue-heading"><div><span>Reliable delivery</span><h2>Schedule and retry queue</h2><p>Store WhatsApp messages for background delivery with automatic backoff.</p></div>{isAdmin && <button className="button button-small" onClick={processDue} disabled={busy}><Play />Process due now</button>}</div>
    <form className="editor-card queue-form" onSubmit={submit}><div className="field-grid three"><label>Title *<input required maxLength="150" value={form.title} onChange={e => field('title', e.target.value)} /></label><label>Recipient phone *<input required value={form.phone_number} onChange={e => field('phone_number', e.target.value.replace(/[^0-9+]/g, ''))} placeholder="919876543210" /></label><label>Target role<select value={form.target_role} onChange={e => field('target_role', e.target.value)}><option value="parent">Parent</option><option value="student">Student</option><option value="teacher">Teacher</option></select></label><label>Portal user ID (optional)<input type="number" min="1" value={form.target_user_id} onChange={e => field('target_user_id', e.target.value)} placeholder="Links this message to inbox" /><small className="field-help">Use the Parent/Student login user ID to show it in their inbox.</small></label><label>Schedule date and time *<input required type="datetime-local" value={form.scheduled_for} onChange={e => field('scheduled_for', e.target.value)} /></label><label>Maximum attempts<input type="number" min="1" max="10" value={form.max_attempts} onChange={e => field('max_attempts', e.target.value)} /></label><label className="wide">Message *<textarea required rows="3" value={form.message} onChange={e => field('message', e.target.value)} /></label></div><button className="button button-small" disabled={busy}><Clock3 />{busy ? 'Saving…' : 'Schedule notification'}</button></form>
    {error && <div className="form-error queue-message">{error}</div>}{message && <div className="success-notice queue-message">{message}</div>}
    <div className="queue-toolbar"><div>{['all','queued','retrying','sent','failed','cancelled'].map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => changeStatus(value)}>{value}<span>{value === 'all' ? Object.values(queue.counts || {}).reduce((sum, count) => sum + count, 0) : queue.counts?.[value] || 0}</span></button>)}</div><button className="refresh-button" onClick={() => load()} disabled={busy}><RefreshCw />Refresh</button></div>
    <section className="data-panel queue-table"><div className="table-wrap"><table><thead><tr><th>Message</th><th>Recipient</th><th>Schedule</th><th>Attempts</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead><tbody>{queue.data.map(row => <tr key={row.id}><td><b>{row.title}</b><small>{row.message}</small>{row.last_error && <em>{row.last_error}</em>}</td><td>{row.phone_number}<small>{row.target_role || '—'} · {row.channel}</small>{row.target_user_id && <small>Inbox user #{row.target_user_id}</small>}</td><td>{row.scheduled_for ? new Date(row.scheduled_for).toLocaleString() : 'Now'}{row.next_attempt_at && <small>Next: {new Date(row.next_attempt_at).toLocaleString()}</small>}</td><td>{row.attempt_count}/{row.max_attempts}</td><td><span className={`delivery-status ${row.status}`}>{row.status}</span></td>{isAdmin && <td><div className="student-row-actions">{['failed','retrying'].includes(row.status) && <button onClick={() => retry(row)} disabled={busy}><RotateCcw />Retry</button>}{['queued','retrying'].includes(row.status) && <button className="danger" onClick={() => cancel(row)} disabled={busy}><XCircle />Cancel</button>}</div></td>}</tr>)}</tbody></table></div>{queue.data.length === 0 && <div className="empty-state"><Send /><h3>No queue records</h3><p>Schedule a message or change the status filter.</p></div>}{pages.pages > 1 && <div className="report-pagination"><button disabled={busy || pages.page <= 1} onClick={() => load(pages.page - 1)}>Previous</button><span>Page {pages.page} of {pages.pages}</span><button disabled={busy || pages.page >= pages.pages} onClick={() => load(pages.page + 1)}>Next</button></div>}</section>
  </section>
}
