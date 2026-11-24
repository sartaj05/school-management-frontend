import { test, expect } from '@playwright/test'

const choices = type => ({ users: [{ id: type === 'parent' ? 1 : 2, name: `${type} account` }], profiles: [{ id: type === 'parent' ? 10 : 20, name: `${type} profile` }] })

test('late parent choices cannot replace student choices', async ({ page }) => {
  let releaseParent, parentStarted
  const started = new Promise(resolve => { parentStarted = resolve })
  await page.route('**/portal/profile-links', route => route.fulfill({ json: { data: [] } }))
  await page.route('**/portal/link-options?*', async route => {
    const type = new URL(route.request().url()).searchParams.get('profile_type')
    if (type === 'parent') { parentStarted(); await new Promise(resolve => { releaseParent = resolve }) }
    await route.fulfill({ json: choices(type) })
  })
  await page.goto('/e2e/portal_links_harness.html')
  await started
  await page.getByLabel('Account type').selectOption('student')
  await expect(page.getByLabel('Login account').locator('option[value="2"]')).toHaveCount(1)
  const completed = page.waitForResponse(response => response.url().includes('profile_type=parent'))
  releaseParent()
  await completed
  // Wait for the response body and React render before checking the selected type.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(page.getByLabel('Login account').locator('option[value="2"]')).toHaveCount(1)
  await expect(page.getByLabel('Login account')).not.toContainText('parent account')
})

test('changing type clears selected IDs and disables linking until matching choices load', async ({ page }) => {
  let releaseStudent
  await page.route('**/portal/profile-links', route => route.fulfill({ json: { data: [] } }))
  await page.route('**/portal/link-options?*', async route => {
    const type = new URL(route.request().url()).searchParams.get('profile_type')
    if (type === 'student') await new Promise(resolve => { releaseStudent = resolve })
    await route.fulfill({ json: choices(type) })
  })
  await page.goto('/e2e/portal_links_harness.html')
  await page.getByLabel('Login account').selectOption('1')
  await page.getByLabel('School profile').selectOption('10')
  const pending = page.waitForRequest('**/portal/link-options?profile_type=student')
  await page.getByLabel('Account type').selectOption('student')
  await pending
  await expect(page.getByLabel('Login account')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Link account', exact: true })).toBeDisabled()
  releaseStudent()
  await expect(page.getByLabel('Login account')).toBeEnabled()
  await expect(page.getByLabel('Login account')).toContainText('student account')
})

test('link submission keeps its account type fixed until the save completes', async ({ page }) => {
  let releaseSave, startedSave, submitted
  const started = new Promise(resolve => { startedSave = resolve })
  await page.route('**/portal/profile-links', async route => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON()
      startedSave()
      await new Promise(resolve => { releaseSave = resolve })
      return route.fulfill({ json: { success: true, message: 'Account linked.' } })
    }
    return route.fulfill({ json: { data: [] } })
  })
  await page.route('**/portal/link-options?*', route => route.fulfill({ json: choices('parent') }))
  await page.goto('/e2e/portal_links_harness.html')
  await page.getByLabel('Login account').selectOption('1')
  await page.getByLabel('School profile').selectOption('10')
  await page.getByRole('button', { name: 'Link account', exact: true }).click()
  await started
  await expect(page.getByLabel('Account type')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Link account', exact: true })).toBeDisabled()
  expect(submitted).toEqual({ user_id: '1', profile_id: '10', profile_type: 'parent' })
  releaseSave()
  await expect(page.getByText('Account linked.', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Account type')).toBeEnabled()
})
