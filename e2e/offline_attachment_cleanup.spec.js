import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('school_access_token', `x.${btoa(JSON.stringify({ sub: '1', schema_context: 'school_a' }))}.x`))
  await page.goto('/e2e/connected_features_harness.html?module=offline')
})

test('delayed attachment removal cannot clear a replacement selected during cleanup', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { stageAttachment, clearAttachment, attachmentMeta } = await import('/src/lib/offlineAttachments.js')
    const key = 'homework:1:7'
    await stageAttachment(key, new File(['old'], 'old.txt'), 'homework')
    const open = indexedDB.open.bind(indexedDB)
    let release, ready
    const waiting = new Promise(resolve => { ready = resolve })
    indexedDB.open = (...args) => {
      const request = open(...args)
      Object.defineProperty(request, 'onsuccess', { set(handler) {
        request.addEventListener('success', () => { release = () => handler(); ready() })
      } })
      return request
    }
    const removing = clearAttachment(key)
    await waiting
    indexedDB.open = open
    const replacement = await stageAttachment(key, new File(['new answer'], 'new.txt'), 'homework')
    release()
    await removing
    return { replacement, saved: attachmentMeta(key) }
  })
  expect(result.saved).toEqual(result.replacement)
})

test('cleanup for a completed submission leaves a newer file available for upload', async ({ page }) => {
  let uploads = 0
  await page.route('**/documents/files', route => {
    uploads++
    expect(route.request().postDataBuffer().toString()).toContain('new answer')
    return route.fulfill({ json: { file: { id: 23 } } })
  })
  const result = await page.evaluate(async () => {
    const { stageAttachment, clearAttachment, attachmentMeta, uploadAttachment } = await import('/src/lib/offlineAttachments.js')
    const key = 'homework:1:7'
    const original = await stageAttachment(key, new File(['old'], 'old.txt'), 'homework')
    const replacement = await stageAttachment(key, new File(['new answer'], 'new.txt'), 'homework')
    await clearAttachment(key, original.owner, original.id)
    const saved = attachmentMeta(key)
    return { replacement, saved, uploaded: saved ? await uploadAttachment(saved) : null }
  })
  expect(result.saved).toEqual(result.replacement)
  expect(result.uploaded).toEqual({ attachment_url: '/api/v1/documents/files/23' })
  expect(uploads).toBe(1)
})
