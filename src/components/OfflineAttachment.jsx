import { useEffect, useState } from 'react'
import { attachmentMeta, stageAttachment, clearAttachment } from '../lib/offlineAttachments'
import { savedDrafts } from '../lib/offlineDrafts'

export default function OfflineAttachment({ draftKey, category, disabled = false }) {
  const [meta, setMeta] = useState(() => attachmentMeta(draftKey)), [busy, setBusy] = useState(false), [error, setError] = useState('')
  useEffect(() => { const update = () => setMeta(attachmentMeta(draftKey)); update(); window.addEventListener('school-drafts-changed', update); return () => window.removeEventListener('school-drafts-changed', update) }, [draftKey])
  const locked = busy || disabled || savedDrafts()[draftKey]?.queued
  async function select(file) {
    if (!file || locked) return
    setBusy(true); setError('')
    try { await stageAttachment(draftKey, file, category) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <div><label>Attachment (saved for offline upload)<input type="file" disabled={locked} onChange={e => { select(e.target.files[0]); e.target.value = '' }} /></label>{meta && <p>{meta.name} · Saved on this device, uploads when submitted. <button type="button" disabled={locked} onClick={async () => { try { await clearAttachment(draftKey) } catch (e) { setError(e.message) } }}>Remove attachment</button></p>}{error && <p role="alert">{error}</p>}</div>
}
