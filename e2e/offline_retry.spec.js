import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('school_access_token', `x.${btoa(JSON.stringify({ sub: '1', schema_context: 'school_a' }))}.x`))
  await page.goto('/e2e/connected_features_harness.html?module=offline')
})

for (const status of [429, 503]) {
  test(`${status} response preserves the submission across reload and retry`, async ({ page }) => {
    const operations = []
    await page.route('**/portal/assignments/7/submission', route => {
      operations.push(route.request().headers()['x-client-operation-id'])
      return operations.length === 1
        ? route.fulfill({ status, json: { message: 'Temporarily unavailable' } })
        : route.fulfill({ json: { success: true } })
    })
    const queued = await page.evaluate(async () => {
      const { submitDraft } = await import('/src/lib/offlineDrafts.js')
      return submitDraft('homework:1:7', '/portal/assignments/7/submission', { content: 'Answer' })
    })
    expect(queued.queued).toBe(true)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Keep as draft for editing' })).toBeDisabled()
    const editingError = await page.evaluate(async () => {
      const { keepDraftForEditing } = await import('/src/lib/offlineDrafts.js')
      try { keepDraftForEditing('homework:1:7') } catch (error) { return error.message }
    })
    expect(editingError).toContain('confirm its outcome')
    await page.getByRole('button', { name: 'Retry submission' }).click()
    await expect(page.getByText('No queued submissions.')).toBeVisible()
    expect(operations).toHaveLength(2)
    expect(operations[0]).toBeTruthy()
    expect(operations[1]).toBe(operations[0])
  })
}

test('a confirmed validation rejection can be edited', async ({ page }) => {
  await page.route('**/portal/assignments/7/submission', route => route.fulfill({ status: 400, json: { message: 'Please correct the answer' } }))
  await page.evaluate(async () => {
    const { submitDraft } = await import('/src/lib/offlineDrafts.js')
    try { await submitDraft('homework:1:7', '/portal/assignments/7/submission', { content: 'Answer', expected_submitted_at: 'old' }) } catch { /* Expected validation rejection. */ }
  })
  await expect(page.getByRole('button', { name: 'Retry submission' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Keep as draft for editing' }).click()
  const saved = await page.evaluate(async () => (await import('/src/lib/offlineDrafts.js')).savedDrafts())
  expect(saved['homework:1:7']).toEqual({ content: 'Answer' })
})

test('older blocked submissions with unknown outcomes keep their operation ID', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('school-drafts:school_a:1', JSON.stringify({ 'homework:1:7': {
      queued: true, blocked: true, operationId: 'original-operation',
      path: '/portal/assignments/7/submission', payload: { content: 'Answer' },
    } }))
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Keep as draft for editing' })).toBeDisabled()
  await page.route('**/portal/assignments/7/submission', route => {
    expect(route.request().headers()['x-client-operation-id']).toBe('original-operation')
    return route.fulfill({ json: { success: true } })
  })
  await page.getByRole('button', { name: 'Retry submission' }).click()
  await expect(page.getByText('No queued submissions.')).toBeVisible()
})
