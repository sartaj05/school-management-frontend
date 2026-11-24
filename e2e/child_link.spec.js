import { test, expect } from '@playwright/test'

async function family(page) {
  await page.addInitScript(() => {
    const token = `x.${btoa(JSON.stringify({ sub: '3', role: 'Parent', schema_context: 'school_a' }))}.x`
    sessionStorage.setItem('school_access_token', token)
    sessionStorage.setItem('school_session', JSON.stringify({ token, user: { id: 3, role: 'Parent', name: 'Parent', school_plan: 'premium' } }))
  })
  const children = [{ id: 1, first_name: 'First', class_name: '5' }, { id: 2, first_name: 'Second', class_name: '6' }]
  const requested = []
  await page.route('**/api/v1/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/portal/me')) return route.fulfill({ json: { account: { role: 'Parent' }, children } })
    if (url.pathname.endsWith('/portal/overview')) {
      requested.push(url.searchParams.get('student_id'))
      return route.fulfill({ json: { data: { fee_balance: 222 } } })
    }
    return route.fulfill({ json: { success: true, data: [], features: {} } })
  })
  return requested
}

test('browser fallback opens the linked second child and permits switching children', async ({ page }) => {
  const requested = await family(page)
  await page.goto('/app/child?school=school_a&student=2')
  await page.getByRole('link', { name: 'Continue on the website' }).click()
  await expect(page.getByLabel('Viewing student')).toHaveValue('2')
  await expect.poll(() => requested).toContain('2')
  expect(requested).not.toContain('1')
  await page.getByLabel('Viewing student').selectOption('1')
  await expect.poll(() => requested).toContain('1')
})

test('unlinked student does not silently open the first child', async ({ page }) => {
  const requested = await family(page)
  await page.goto('/dashboard?page=portal&school=school_a&student=999')
  await expect(page.getByText('This child is not linked to your account.', { exact: true })).toBeVisible()
  expect(requested).toEqual([])
})

test('a link for another school cannot select a same-numbered child', async ({ page }) => {
  const requested = await family(page)
  await page.goto('/dashboard?page=portal&school=school_b&student=2')
  await expect(page.getByText('This link belongs to a different school. Sign in to that school first.', { exact: true })).toBeVisible()
  expect(requested).toEqual([])
})
