import { expect, test } from '@playwright/test'
import { exerciseRolePage } from './local_actions'

// Opt-in: this suite creates synthetic tenants/accounts in a running LOCAL database.
const env = globalThis.process.env
const password = env.LOCAL_DEMO_PASSWORD
const plans = ['Trial', 'Standard', 'Premium', 'Enterprise']
test.skip(env.LOCAL_PORTAL_E2E !== '1' || !password, 'Set LOCAL_PORTAL_E2E=1 and LOCAL_DEMO_PASSWORD.')
test.setTimeout(600_000)
test.use({ actionTimeout: 15_000 })

async function login(page, role = 'superadmin') {
  await page.goto('/login')
  if (role === 'superadmin') await page.getByRole('button', { name: /^Super admin$/i }).click()
  else await page.locator('input[name="school_domain"]').fill('eduflow_demo_local')
  await page.locator('input[name="email"]').fill(`local.${role}@eduflow.test`)
  await page.locator('input[name="password"]').fill(role === 'superadmin' ? password : (env.LOCAL_FINAL_PASSWORD || password))
  await page.getByRole('button', { name: 'Sign in securely' }).click()
  await expect(page.locator('.dashboard-main')).toBeVisible()
  await expect(page.locator('.session-feedback-backdrop')).toBeHidden()
}

async function navigate(page, name) {
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true })
  if (await menu.isVisible() && !await page.locator('.sidebar').evaluate(el => el.classList.contains('open'))) await menu.click()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true }).click()
  await expect(page.locator('.dashboard-header h1')).toHaveText(name)
  await expect(page.locator('.loading-grid')).toBeHidden()
}

async function checkLayout(page, label, testInfo) {
  await page.evaluate(() => document.fonts.ready)
  const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }))
  expect.soft(overflow.scroll, `${label}: page should not scroll horizontally`).toBeLessThanOrEqual(overflow.width + 1)
  const title = page.locator('.dashboard-header h1')
  if (await title.count()) {
    const dimensions = await title.evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }))
    expect.soft(dimensions.scroll, `${label}: title fits`).toBeLessThanOrEqual(dimensions.width + 1)
  }
  await page.screenshot({ path: testInfo.outputPath(`${label.replace(/[^a-z0-9]/gi, '-')}.png`), fullPage: true })
}

test('four plan schools and School Admin accounts through UI', async ({ page }, testInfo) => {
  await login(page)
  for (const [index, plan] of plans.entries()) {
    const key = plan.toLowerCase()
    const name = `EduFlow ${plan} Test School`
    await navigate(page, 'Schools')
    await page.getByPlaceholder('Search school, domain or email').fill(`eduflow_demo_plan_${key}`)
    await expect(page.locator('.directory-loading')).toBeHidden()
    // Search is debounced; wait for its corresponding API response before deciding to create.
    await page.waitForTimeout(700)
    if (!await page.getByRole('cell').filter({ hasText: name }).count()) {
      await page.getByRole('button', { name: 'Add school', exact: true }).click()
      const form = page.locator('form.editor-card')
      await form.getByLabel('School name *', { exact: true }).fill(name)
      await form.getByLabel(/Unique domain/).fill(`eduflow-demo-plan-${key}`)
      await form.getByLabel(/School login email/).fill(`admin.${key}@demo.eduflow.test`)
      await form.getByRole('combobox', { name: 'Plan *', exact: true }).selectOption(plan)
      await form.locator('input[type="file"]').setInputFiles(env.LOCAL_SCHOOL_LOGO)
      await form.getByRole('button', { name: 'Add school', exact: true }).click()
      await expect(page.locator('.success-notice')).toContainText('School created successfully')
    }
    await navigate(page, 'Users')
    await page.getByRole('button', { name: 'Add School Admin', exact: true }).click()
    const form = page.locator('.editor-card').filter({ has: page.getByRole('heading', { name: 'Create a School Admin' }) })
    await expect(page.getByRole('combobox', { name: 'School *', exact: true })).toBeVisible()
    await page.waitForTimeout(500)
    if (await form.locator(`option[value="eduflow_demo_plan_${key}"]`).count()) {
      await page.getByRole('combobox', { name: 'School *', exact: true }).selectOption(`eduflow_demo_plan_${key}`)
      await form.getByLabel('Admin full name *', { exact: true }).fill(`${plan} Test Admin`)
      await form.getByLabel(/Mobile/).fill(`+91990000300${index}`)
      await form.getByLabel(/Temporary password/).fill(password)
      await form.getByLabel('Confirm password *', { exact: false }).fill(password)
      await form.getByRole('button', { name: 'Create School Admin', exact: true }).click()
      await expect(form).toBeHidden()
      await expect(page.locator('.success-notice')).toBeVisible()
    } else {
      await page.getByRole('button', { name: 'Close form', exact: true }).click()
      await page.getByPlaceholder('Search name, email or mobile').fill(`admin.${key}@demo.eduflow.test`)
      await expect(page.getByRole('cell', { name: `admin.${key}@demo.eduflow.test`, exact: true })).toBeVisible()
    }
    await checkLayout(page, `${key}-admin-created`, testInfo)
  }
})

for (const role of ['superadmin', 'admin', 'teacher', 'student', 'parent']) {
  test(`${role}: every available module at desktop, tablet and mobile`, async ({ page }, testInfo) => {
    const errors = []
    const tag = `${role}-${Date.now()}`
    page.on('pageerror', error => errors.push(error.message))
    await login(page, role)
    const names = await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button').allTextContents()
    const widths = env.LOCAL_VISIBLE_WALKTHROUGH === '1' ? [1440] : [1440, 1024, 768, 390, 320]
    for (const width of widths) {
      console.log(`Checking ${role} at ${width}px`)
      await page.setViewportSize({ width, height: 900 })
      for (const name of names) {
        await navigate(page, name.trim())
        await page.waitForTimeout(400)
        if (env.LOCAL_VISIBLE_WALKTHROUGH === '1' && role !== 'superadmin') {
          await exerciseRolePage(page, name.trim(), role, tag)
        }
        await checkLayout(page, `${role}-${width}-${name}`, testInfo)
        expect.soft(await page.locator('.api-notice,.form-error').allTextContents(), `${role}/${name}: API errors`).toEqual([])
      }
    }
    expect(errors).toEqual([])
  })
}

test('public pages fit small phones and tablets', async ({ page }, testInfo) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/login', '/contact', '/admissions/apply']) {
      await page.goto(path)
      await checkLayout(page, `public-${width}-${path}`, testInfo)
    }
  }
})

test('Superadmin school, user, branch, content and maintenance controls', async ({ page }, testInfo) => {
  await login(page)
  if (!env.LOCAL_SUPER_RESUME) {
  await navigate(page, 'Schools')
  await page.getByPlaceholder('Search school, domain or email').fill('eduflow_demo_plan_trial')
  const schoolRow = page.getByRole('row').filter({ hasText: 'EduFlow Trial Test School' })
  await page.waitForTimeout(500)
  if (!await schoolRow.count()) {
    await page.getByRole('button', { name: 'Deactivated schools', exact: true }).click()
    await schoolRow.getByRole('button', { name: 'Activate', exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Activate school' }).click()
    await expect(schoolRow).toHaveCount(0)
    await page.getByRole('button', { name: 'Active schools', exact: true }).click()
  }
  await expect(schoolRow).toHaveCount(1)
  await schoolRow.getByRole('button', { name: 'View', exact: true }).click()
  await expect(page.locator('.school-detail-card')).toContainText('eduflow_demo_plan_trial')
  await page.locator('.school-detail-card').getByRole('button', { name: 'Close', exact: true }).click()
  await schoolRow.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Save school', exact: true }).click()
  await expect(page.locator('.school-crud-message.success-notice')).toBeVisible()
  await schoolRow.getByRole('button', { name: 'Deactivate', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate school' }).click()
  await expect(schoolRow).toHaveCount(0)
  await page.getByRole('button', { name: 'Deactivated schools', exact: true }).click()
  await schoolRow.getByRole('button', { name: 'Activate', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Activate school' }).click()
  await expect(schoolRow).toHaveCount(0)
  await page.getByRole('button', { name: 'Active schools', exact: true }).click()
  await expect(schoolRow.locator('.status-pill')).toHaveText('active')
  }

  if (env.LOCAL_SUPER_RESUME !== 'branches') {
  await navigate(page, 'Users')
  await page.getByPlaceholder('Search name, email or mobile').fill('admin.trial@demo.eduflow.test')
  const userRow = page.getByRole('row').filter({ hasText: 'admin.trial@demo.eduflow.test' })
  await expect(userRow).toHaveCount(1)
  await page.locator('.user-directory').getByRole('combobox', { name: 'Plan', exact: true }).selectOption('trial')
  await page.locator('.user-directory').getByRole('combobox', { name: 'Role', exact: true }).selectOption('School Admin')
  await expect(userRow).toHaveCount(1)
  await page.getByRole('button', { name: /^Clear filters:/ }).click()
  await expect(page.getByPlaceholder('Search name, email or mobile')).toHaveValue('')
  await page.getByPlaceholder('Search name, email or mobile').fill('admin.trial@demo.eduflow.test')
  await userRow.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Save user', exact: true }).click()
  await expect(page.locator('.user-directory-message.success-notice')).toBeVisible()
  await userRow.getByRole('button', { name: 'Deactivate', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate user' }).click()
  await expect(userRow).toHaveCount(0)
  await page.getByRole('button', { name: 'Deactivated users', exact: true }).click()
  await userRow.getByRole('button', { name: 'Activate', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Activate user' }).click()
  await expect(userRow).toHaveCount(0)
  await page.getByRole('button', { name: 'Active users', exact: true }).click()
  await expect(userRow).toBeVisible()
  }

  await navigate(page, 'Branches')
  await expect(page.getByRole('heading', { name: 'Register a branch' })).toBeVisible()
  await page.waitForTimeout(500)
  let branchRow = page.locator('.branch-directory-panel').getByRole('row').filter({ hasText: 'Local Trial Campus' })
  if (!await branchRow.count()) {
    await page.getByLabel('Group name *').fill('EduFlow Local Test Group')
    await page.getByLabel('Branch code *').fill('LOCAL-TRIAL')
    await page.getByLabel('Branch name *').fill('Local Trial Campus')
    const option = page.getByRole('combobox', { name: 'School tenant *', exact: true }).locator('option').filter({ hasText: 'eduflow_demo_plan_trial' })
    await page.getByRole('combobox', { name: 'School tenant *', exact: true }).selectOption(await option.getAttribute('value'))
    await page.getByRole('button', { name: 'Add branch', exact: true }).click()
  }
  await expect(branchRow).toBeVisible()
  if (await branchRow.getByRole('button', { name: 'Activate', exact: true }).count()) {
    await branchRow.getByRole('button', { name: 'Activate', exact: true }).click()
    await expect(branchRow.getByRole('button', { name: 'Deactivate', exact: true })).toBeVisible()
  }
  await branchRow.getByRole('button', { name: 'Deactivate', exact: true }).click()
  await expect(branchRow).toContainText('inactive')
  await branchRow.getByRole('button', { name: 'Activate', exact: true }).click()
  await expect(branchRow).toContainText('active')
  await page.locator('.branch-group-filter select').selectOption('EduFlow Local Test Group')
  await expect(page.locator('.branch-summary')).toContainText('EduFlow Local Test Group')
  await checkLayout(page, 'branch-tested', testInfo)

  await navigate(page, 'Website Content')
  await expect(page.getByRole('button', { name: 'Save public content' })).toBeEnabled()
  const saved = page.waitForResponse(r => r.url().includes('/public/content') && r.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Save public content' }).click()
  expect((await saved).ok()).toBeTruthy()
  await expect(page.locator('.success-notice')).toBeVisible()

  await navigate(page, 'Maintenance')
  await expect(page.getByRole('button', { name: 'Run tenant upgrade' })).toBeDisabled()
  if (env.LOCAL_BACKUP_CONFIRMED === '1') {
    await page.getByPlaceholder('UPGRADE', { exact: true }).fill('UPGRADE')
    await page.getByRole('button', { name: 'Run tenant upgrade' }).click()
    await expect(page.locator('.upgrade-result')).toBeVisible({ timeout: 90_000 })
    await expect(page.locator('.upgrade-result')).toContainText('school schema(s) checked')
  }
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click()
  await expect(page.locator('.form-error,.api-notice')).toHaveCount(0)
})
