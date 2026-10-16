import { useEffect, useState } from 'react'
import { savedDrafts, saveDraft, submitDraft } from '../lib/offlineDrafts'

export default function OfflineDrafts({ onChanged }) {
  const [rows, setRows] = useState(savedDrafts), [busy, setBusy] = useState(false), [error, setError] = useState('')
  useEffect(() => { const update = () => setRows(savedDrafts()); window.addEventListener('school-drafts-changed', update); return () => window.removeEventListener('school-drafts-changed', update) }, [])
  async function retry(key, row) { setBusy(true); try { const r = await submitDraft(key, row.path, row.payload); if (!r.queued) onChanged?.() } catch (e) { setError(e.message) } finally { setBusy(false) } }
  const queued = Object.entries(rows).filter(([, r]) => r.queued)
  return <section className="data-panel"><h3>Offline drafts</h3><p>Text drafts are saved on this device for this school account. Attachments must be uploaded online. Queued work is not submitted until the server confirms it.</p>{error && <p role="alert">{error}</p>}{queued.length === 0 && <p>No queued submissions.</p>}{queued.map(([key, row]) => <article key={key}><b>{key}</b><p>{row.error || 'Waiting to submit'}</p>{!row.blocked && <button disabled={busy} onClick={() => retry(key, row)}>Retry submission</button>}{row.blocked && <p>Reload current records and review your draft before sending again.</p>}<button disabled={busy} onClick={() => saveDraft(key, Object.fromEntries(Object.entries(row.payload).filter(([field]) => field !== 'expected_submitted_at')))}>Keep as draft for editing</button></article>)}</section>
}
