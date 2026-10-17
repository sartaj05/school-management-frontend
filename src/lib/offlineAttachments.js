import { api } from './api'
import { draftScope } from './offlineDrafts'

const metaKey = (owner, key) => `school-attachment:${owner}:${key}`
function assertOwner(owner) { if (!owner || draftScope() !== owner) throw new Error('The signed-in school account changed. Reopen your draft.') }
async function blobs(mode, action) {
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open('eduflow-offline-attachments', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('files')
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error)
  })
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('files', mode), r = action(tx.objectStore('files'))
      tx.oncomplete = () => resolve(r.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Attachment storage failed.'))
    })
  } finally { db.close() }
}
export function attachmentMeta(key) {
  try { return JSON.parse(localStorage.getItem(metaKey(draftScope(), key))) } catch { return null }
}
export async function stageAttachment(key, file, category) {
  const owner = draftScope(); assertOwner(owner)
  if (!['homework', 'leave'].includes(category) || !file.size || file.size > 25 * 1024 * 1024) throw new Error('Select a homework or leave file between 1 byte and 25 MB.')
  const old = attachmentMeta(key), id = crypto.randomUUID(), meta = { id, name: file.name, category, owner }
  await blobs('readwrite', store => store.put(file, `${owner}:${id}`))
  try { assertOwner(owner); localStorage.setItem(metaKey(owner, key), JSON.stringify(meta)) }
  catch (e) { await blobs('readwrite', store => store.delete(`${owner}:${id}`)); throw e }
  if (old) await blobs('readwrite', store => store.delete(`${owner}:${old.id}`))
  window.dispatchEvent(new Event('school-drafts-changed'))
  return meta
}
export async function clearAttachment(key, owner = draftScope()) {
  const raw = localStorage.getItem(metaKey(owner, key)); if (!raw) return
  const meta = JSON.parse(raw)
  await blobs('readwrite', store => store.delete(`${owner}:${meta.id}`))
  localStorage.removeItem(metaKey(owner, key))
  window.dispatchEvent(new Event('school-drafts-changed'))
}
export async function uploadAttachment(meta) {
  assertOwner(meta.owner)
  const file = await blobs('readonly', store => store.get(`${meta.owner}:${meta.id}`))
  assertOwner(meta.owner)
  if (!file) { const e = new Error('Saved attachment is missing. Keep the submission as a draft and choose the file again.'); e.status = 409; throw e }
  const body = new FormData(); body.append('file', file, meta.name); body.append('category', meta.category)
  const result = await api('/documents/files', { method: 'POST', accountScope: meta.owner, headers: { 'X-Client-Operation-Id': `upload-${meta.id}` }, body })
  assertOwner(meta.owner)
  return meta.category === 'leave' ? { attachment_file_id: result.file.id } : { attachment_url: `/api/v1/documents/files/${result.file.id}` }
}
