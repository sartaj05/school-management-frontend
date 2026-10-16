import { test, expect } from '@playwright/test'
for (const width of [390, 1440]) test(`homework revision history at ${width}px retains earlier answer and grade`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.route('**/assignments/7/submissions/2/history', r => r.fulfill({ json: { data: [
    { id: 2, revision: 2, event_type: 'graded', recorded_at: '2026-10-17T10:00:00Z', actor_name: 'Teacher', actor_role: 'Teacher', snapshot: { content: 'Revised answer', status: 'graded', score: 95, feedback: 'Correct reasoning' } },
    { id: 1, revision: 1, event_type: 'submitted', recorded_at: '2026-10-16T10:00:00Z', actor_name: 'Student', snapshot: { content: 'First answer', status: 'submitted' } },
  ], next_before: null } }))
  await page.goto('/e2e/connected_features_harness.html?module=history')
  await page.getByRole('button', { name: 'View revision history' }).click()
  await expect(page.getByText('First answer', { exact: true })).toBeVisible()
  await expect(page.getByText('Feedback: Correct reasoning')).toBeVisible()
  await expect(page.getByText('Status: graded · Score: 95')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
