import { test, expect } from '@playwright/test'
test('offline file persists across reload, uploads once, retries with same ID, and stays account scoped', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('school_access_token', `x.${btoa(JSON.stringify({ sub: '1', schema_context: 'school_a' }))}.x`))
  await page.goto('/e2e/connected_features_harness.html?module=offline')
  await page.evaluate(async () => {
    const { stageAttachment } = await import('/src/lib/offlineAttachments.js')
    await stageAttachment('homework:1:7', new File(['My answer'], 'answer.txt', { type: 'text/plain' }), 'homework')
  })
  await page.reload()
  let uploads = 0, submissions = 0, operation
  await page.route('**/documents/files', route => {
    uploads++; expect(route.request().headers()['x-client-operation-id']).toMatch(/^upload-/)
    expect(route.request().postDataBuffer().toString()).toContain('My answer')
    return route.fulfill({ json: { file: { id: 17 } } })
  })
  await page.route('**/portal/assignments/7/submission', route => {
    submissions++; operation ||= route.request().headers()['x-client-operation-id']
    expect(route.request().headers()['x-client-operation-id']).toBe(operation)
    expect(route.request().postDataJSON().attachment_url).toBe('/api/v1/documents/files/17')
    return submissions === 1 ? route.abort('internetdisconnected') : route.fulfill({ json: { success: true } })
  })
  const queued = await page.evaluate(async () => {
    const { submitDraft } = await import('/src/lib/offlineDrafts.js')
    return submitDraft('homework:1:7', '/portal/assignments/7/submission', { content: 'Answer' })
  })
  expect(queued.queued).toBe(true)
  await expect(page.getByText('answer.txt · Uploaded, waiting to submit')).toBeVisible()
  const other = await page.evaluate(async () => {
    sessionStorage.setItem('school_access_token', `x.${btoa(JSON.stringify({ sub: '2', schema_context: 'school_b' }))}.x`)
    const { attachmentMeta } = await import('/src/lib/offlineAttachments.js')
    const { savedDrafts } = await import('/src/lib/offlineDrafts.js')
    return { file: attachmentMeta('homework:1:7'), drafts: savedDrafts() }
  })
  expect(other).toEqual({ file: null, drafts: {} })
  await page.reload()
  await page.getByRole('button', { name: 'Retry submission' }).click()
  await expect(page.getByText('No queued submissions.')).toBeVisible()
  expect(uploads).toBe(1); expect(submissions).toBe(2)
})
