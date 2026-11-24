import { test, expect } from '@playwright/test'

test.use({ timezoneId: 'Asia/Kolkata' })

for (const suffix of ['', '+00:00']) {
  test(`schedule and run history show the same instant for ${suffix || 'legacy UTC'} responses`, async ({ page }) => {
    await page.route('**/api/v1/reports/catalog', route => route.fulfill({ json: { reports: [{ key: 'attendance', label: 'Attendance', filters: [] }] } }))
    await page.route('**/api/v1/scheduled-reports', route => route.fulfill({ json: { data: [{
      id: 1, report_key: 'attendance', export_format: 'csv', schedule_type: 'daily',
      run_at: '10:00', timezone: 'Asia/Kolkata', channels: ['email'],
      email_recipients: ['office@example.test'], is_active: true, next_run_at: `2026-11-23T04:30:00${suffix}`,
    }] } }))
    await page.route('**/api/v1/scheduled-reports/1/runs', route => route.fulfill({ json: { data: [{
      id: 4, status: 'completed', record_count: 2, started_at: `2026-11-23T04:30:00${suffix}`,
    }] } }))
    await page.goto('/e2e/student_support_harness.html?module=schedules')
    const expected = await page.evaluate(() => new Date('2026-11-23T04:30:00Z').toLocaleString())
    await expect(page.getByRole('cell', { name: expected, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Runs', exact: true }).click()
    await expect(page.locator('.scheduled-run-history')).toContainText(expected)
    await expect(page.getByText('Invalid Date', { exact: true })).toHaveCount(0)
  })
}
