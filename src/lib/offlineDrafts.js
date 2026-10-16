import { attachmentMeta, uploadAttachment, clearAttachment } from './offlineAttachments'
import { api } from './api'

export function draftScope() {
  try {
    const part = sessionStorage.getItem('school_access_token').split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
    const claims = JSON.parse(atob(part))
    return claims.sub && claims.schema_context ? `${claims.schema_context}:${claims.sub}` : null
  } catch { return null }
}
const storageKey = () => { const scope = draftScope(); if (!scope) throw new Error('Sign in to save an offline draft.'); return `school-drafts:${scope}` }
export function savedDrafts() { try { return JSON.parse(localStorage.getItem(storageKey()) || '{}') } catch { return {} } }
export function saveDraft(key, data) {
  const rows = savedDrafts(); if (data === null) delete rows[key]; else rows[key] = data
  localStorage.setItem(storageKey(), JSON.stringify(rows)); window.dispatchEvent(new Event('school-drafts-changed'))
}
export async function submitDraft(key, path, payload) {
  const owner = draftScope()
  // Keep the original body and operation ID when the response was lost.
  const previous = savedDrafts()[key]
  if (previous?.queued && JSON.stringify(previous.payload) !== JSON.stringify(payload)) throw new Error('A previous submission is waiting. Retry it from Offline drafts before sending changes.')
  const row = previous?.queued ? previous : { path, payload, operationId: crypto.randomUUID(), queued: true, attachment: attachmentMeta(key) }
  saveDraft(key, row)
  try {
    if (row.attachment && !row.resolvedPayload) {
      const fields = await uploadAttachment(row.attachment)
      if (draftScope() !== owner) throw new Error('Account changed during upload.')
      row.resolvedPayload = { ...row.payload, ...fields }
      saveDraft(key, row)
    }
    if (draftScope() !== owner) throw new Error('Account changed before submission.')
    const result = await api(row.path, { method: 'POST', accountScope: owner, headers: { 'X-Client-Operation-Id': row.operationId }, body: JSON.stringify(row.resolvedPayload || row.payload) })
    if (draftScope() === owner) {
      saveDraft(key, null)
      // A confirmed submission must not be replayed if local cleanup fails.
      clearAttachment(key, owner).catch(() => {})
    }
    return result
  } catch (e) {
    if (draftScope() !== owner) throw e
    if (e.status) { saveDraft(key, { ...row, blocked: true, error: e.message }); throw e }
    saveDraft(key, { ...row, error: 'Waiting for connection. Not confirmed by the school.' })
    return { queued: true, message: 'Saved offline. Not submitted yet; retry from Offline drafts when connected.' }
  }
}
