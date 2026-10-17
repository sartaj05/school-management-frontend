import { useState } from 'react'
import { api, downloadApi } from '../lib/api'

export default function HomeworkHistory({ assignmentId, studentId }) {
  const [open, setOpen] = useState(false), [rows, setRows] = useState([]), [next, setNext] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function load(more = false) {
    setOpen(true); setBusy(true); setError('')
    try {
      const r = await api(`/assignments/${assignmentId}/submissions/${studentId}/history${more && next ? `?before=${next}` : ''}`)
      setRows(old => more ? [...old, ...r.data] : r.data); setNext(r.next_before)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function file(url) {
    try { await downloadApi(url.replace(/^\/api\/v1/, ''), 'homework-attachment') } catch (e) { setError(e.message) }
  }
  return <div><button type="button" disabled={busy} onClick={() => open ? setOpen(false) : load()}>{open ? 'Hide revision history' : 'View revision history'}</button>{open && <section aria-label="Homework revision history"><h4>Submission and feedback history</h4>{error && <p role="alert">{error}</p>}{busy && <p role="status">Loading history…</p>}{!busy && !rows.length && !error && <p>No revisions recorded yet. Earlier versions from before history was enabled cannot be reconstructed.</p>}{rows.map(r => <article key={r.id} style={{ borderTop: '1px solid #ddd', padding: '12px 0', overflowWrap: 'anywhere' }}><b>Revision {r.revision} · {r.event_type.replaceAll('_', ' ')}</b><p>{new Date(r.recorded_at).toLocaleString()} · {r.actor_name || 'Existing record'} {r.actor_role && `(${r.actor_role})`}</p><p style={{ whiteSpace: 'pre-wrap' }}>{r.snapshot.content || 'Attachment-only submission'}</p>{r.snapshot.attachment_url && (/^\/api\/v1\/documents\/files\/\d+$/.test(r.snapshot.attachment_url) ? <button type="button" onClick={() => file(r.snapshot.attachment_url)}>Download revision attachment</button> : /^https?:\/\//.test(r.snapshot.attachment_url) ? <a href={r.snapshot.attachment_url} target="_blank" rel="noreferrer">View attachment link</a> : <span>Attachment link unavailable</span>)}<p>Status: {r.snapshot.status}{r.snapshot.score != null && ` · Score: ${r.snapshot.score}`}</p>{r.snapshot.feedback && <p>Feedback: {r.snapshot.feedback}</p>}</article>)}{next && <button type="button" disabled={busy} onClick={() => load(true)}>Load older revisions</button>}</section>}</div>
}
