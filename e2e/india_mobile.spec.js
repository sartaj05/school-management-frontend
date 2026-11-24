import { test, expect } from '@playwright/test'

test('admission phone fields preserve pasted international numbers and reject extra digits', async ({ page }) => {
  await page.route('**/api/v1/school/list', route => route.fulfill({ json: { schools: [] } }))
  await page.goto('/admissions/apply')
  const mobile = page.getByLabel('Guardian mobile').first()
  await mobile.fill('0091 9123456789')
  await expect(mobile).toHaveValue('+919123456789')
  expect(await mobile.evaluate(input => input.validity.valid)).toBe(true)
  await mobile.fill('+9198765432101')
  await expect(mobile).toHaveValue('+9198765432101')
  expect(await mobile.evaluate(input => input.validity.patternMismatch)).toBe(true)
})
