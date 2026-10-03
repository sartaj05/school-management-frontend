import { expect, test } from '@playwright/test'

const env = globalThis.process?.env ?? {}
const credentials = {
  domain: env.E2E_SCHOOL_DOMAIN,
  email: env.E2E_ADMIN_EMAIL,
  password: env.E2E_ADMIN_PASSWORD,
}
const configured = Object.values(credentials).every(Boolean)

async function login(page) {
  await page.goto('/login')
  await page.locator('input[name="school_domain"]').fill(credentials.domain)
  await page.locator('input[name="email"]').fill(credentials.email)
  await page.locator('input[name="password"]').fill(credentials.password)
  await page.getByRole('button', { name: /sign in securely/i }).click()
  await page.waitForURL('**/dashboard')
  await expect(page.locator('.dashboard-main')).toBeVisible()
}

test.describe('React browser release smoke', () => {
  test.skip(!configured, 'Set E2E_SCHOOL_DOMAIN, E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.')

  test('logs in and opens the tenant dashboard', async ({ page }) => {
    await login(page)
    await expect(page.locator('.sidebar')).toContainText('Students')
    await expect(page.locator('.sidebar')).toContainText('Fees')
    await expect(page.locator('.sidebar')).toContainText('Notifications')
  })

  test('creates a student through the browser CRUD form', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Students', exact: true }).click()
    await page.getByRole('button', { name: /add student/i }).click()
    const admission = `E2E-${Date.now()}`
    await page.getByLabel(/Admission number/).fill(admission)
    await page.getByLabel(/First name/).fill('Browser')
    await page.getByLabel(/Class/).fill('Grade 5')
    await page.getByLabel(/Section/).fill('A')
    await page.getByRole('button', { name: /register student/i }).click()
    await expect(page.getByText(/student registered successfully/i)).toBeVisible()
    await expect(page.locator('.student-directory')).toContainText(admission)
  })

  test('loads fee management and notification queue workflows', async ({ page }) => {
    await login(page)

    await page.getByRole('button', { name: 'Fees', exact: true }).click()
    await expect(page.getByText('Create fee structure')).toBeVisible()
    await expect(page.getByText('Collection register')).toBeVisible()

    await page.getByRole('button', { name: 'Notifications', exact: true }).click()
    await expect(page.getByText('Schedule notification')).toBeVisible()
    await expect(page.getByText('Delivery queue')).toBeVisible()
  })

  test('shows an explicit offline error boundary instead of reporting a false success', async ({ page }) => {
    await login(page)
    await page.context().setOffline(true)
    await page.getByRole('button', { name: 'Students', exact: true }).click()
    await expect(page.getByText('Could not load this page.')).toBeVisible()
    await page.context().setOffline(false)
  })
})
