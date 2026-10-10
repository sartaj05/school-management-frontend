import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'

const env = globalThis.process.env
test.skip(env.LOCAL_PORTAL_E2E !== '1' || !env.LOCAL_FINAL_PASSWORD, 'Requires synthetic local school accounts.')
test.setTimeout(600_000)
test.use({ actionTimeout: 15_000 })

test('admin additional module workflows in sidebar order', async ({ page }, testInfo) => {
  const tag = String(Date.now())
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/login')
  await page.locator('[name=school_domain]').fill('eduflow_demo_local')
  await page.locator('[name=email]').fill('local.admin@eduflow.test')
  await page.locator('[name=password]').fill(env.LOCAL_FINAL_PASSWORD)
  await page.getByRole('button', { name: 'Sign in securely' }).click()
  await expect(page.locator('.dashboard-main')).toBeVisible()
  await expect(page.locator('.session-feedback-backdrop')).toBeHidden()
  const form = title => page.locator('form').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
  const fill = async (scope, values) => { for (const [name, value] of Object.entries(values)) await scope.getByLabel(name, { exact: true }).fill(value) }
  const download = async (button, extension) => {
    const result = page.waitForEvent('download')
    await button.click()
    expect((await result).suggestedFilename()).toMatch(new RegExp(`\\.${extension}$`))
  }
  const steps = {
    'School Onboarding': async () => {
      for (const entity of ['Students', 'Teachers', 'Classes', 'Users', 'Parents', 'Fee records']) {
        await page.locator('.onboarding-type-grid').getByRole('button', { name: new RegExp(`^${entity} `) }).click()
        await download(page.getByRole('button', { name: `Download ${entity} template`, exact: true }), 'csv')
      }
      await page.locator('.onboarding-type-grid').getByRole('button', { name: /^Classes / }).click()
      await page.locator('.onboarding-upload input').setInputFiles({ name: 'synthetic-class.csv', mimeType: 'text/csv', buffer: Buffer.from(`class_name,section,description\nImport ${tag},A,Synthetic browser import\n`) })
      await page.getByRole('button', { name: 'Preview file', exact: true }).click()
      await expect(page.locator('.onboarding-ready')).toBeVisible()
      await page.getByRole('button', { name: 'Import records', exact: true }).click()
      await expect(page.locator('.success-notice')).toBeVisible()
    },
    'Staff HR': async () => {
      for (const tab of ['Overview', 'Documents', 'Contracts', 'Performance reviews', 'Salary history']) {
        const button = page.locator('.staff-hr-management').getByRole('button', { name: tab, exact: true })
        if (await button.count()) await button.click()
      }
      await page.locator('.staff-hr-management').getByRole('button', { name: 'Documents', exact: true }).click()
      const editor = form('Add staff document')
      await editor.getByRole('combobox', { name: 'Staff member', exact: true }).selectOption({ index: 1 })
      await fill(editor, { Title: `Synthetic HR document ${tag}`, Notes: 'Local UI test record.' })
      await editor.getByRole('button', { name: 'Save document', exact: true }).click()
      await expect(page.locator('table')).toContainText(`Synthetic HR document ${tag}`)
    },
    'Exams & Results': async () => {
      const editor = form('Create an exam')
      await fill(editor, { 'Exam name *': `UI exam ${tag}` })
      await editor.getByRole('combobox', { name: 'Class *', exact: true }).selectOption({ index: 1 })
      await editor.getByRole('button', { name: 'Create exam', exact: true }).click()
      await expect(page.locator('.success-notice')).toBeVisible()
      await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption({ index: 1 })
      await page.getByRole('button', { name: 'Load marks', exact: true }).click()
      await page.getByRole('button', { name: 'Report cards', exact: true }).click()
    },
    'Smart Classroom': async () => {
      const editor = form('Create a smart class session')
      await editor.getByRole('combobox', { name: 'Class', exact: true }).selectOption({ index: 1 })
      await editor.getByRole('combobox', { name: 'Teacher', exact: true }).selectOption({ index: 1 })
      await fill(editor, { 'Session title': `UI classroom ${tag}` })
      await editor.getByRole('button', { name: 'Create session', exact: true }).click()
      await expect(page.locator('.data-panel')).toContainText(`UI classroom ${tag}`)
    },
    'Inventory & Assets': async () => {
      await page.getByRole('button', { name: 'Add items / categories / rooms', exact: true }).click()
      const category = form('Add category')
      await fill(category, { 'Category name': `UI category ${tag}` })
      await category.getByRole('button', { name: 'Save', exact: true }).click()
      const editor = form('Add stock item')
      await fill(editor, { 'Unique code / asset tag': `UI-${tag}`, 'Item name': `UI test asset ${tag}`, 'Opening quantity': '5' })
      await editor.getByRole('combobox', { name: 'Category', exact: true }).selectOption({ label: `UI category ${tag}` })
      await editor.getByRole('button', { name: 'Create item', exact: true }).click()
      await page.getByLabel('Search items', { exact: true }).fill(`UI-${tag}`)
      const row = page.locator('tr').filter({ hasText: `UI-${tag}` })
      await row.getByRole('button', { name: 'Open', exact: true }).click()
      await page.getByRole('button', { name: 'Receive / write off', exact: true }).click()
      const stock = form('Record stock movement')
      await fill(stock, { Quantity: '2', 'Reason / notes': 'Synthetic receipt for browser test.' })
      await stock.getByRole('button', { name: 'Save', exact: true }).click()
      await expect(page.locator('.form-error')).toHaveCount(0)
    },
    Transport: async () => {
      const editor = page.locator('form').filter({ has: page.getByRole('button', { name: 'Add vehicle', exact: true }) })
      await fill(editor, { 'Vehicle number *': `UI-${tag}`, 'Driver name *': 'Synthetic Test Driver', 'Driver mobile *': '+919900004444' })
      await editor.getByRole('button', { name: 'Add vehicle', exact: true }).click()
      await expect(page.locator('.transport-card-grid')).toContainText(`UI-${tag}`)
      const route = page.locator('form').filter({ has: page.getByRole('button', { name: 'Create route', exact: true }) })
      await fill(route, { 'Route name *': `UI route ${tag}`, 'Route code': `UI-${tag}` })
      const vehicle = route.getByRole('combobox', { name: 'Vehicle', exact: true })
      await vehicle.selectOption(await vehicle.locator('option').filter({ hasText: `UI-${tag}` }).getAttribute('value'))
      await route.getByRole('button', { name: 'Create route', exact: true }).click()
      await expect(page.locator('.transport-route-list')).toContainText(`UI route ${tag}`)
    },
    Scholarships: async () => {
      const editor = form('Create program')
      await fill(editor, { 'Name *': `UI scholarship ${tag}`, 'Value *': '100', 'Academic year *': '2026-2027', Criteria: 'Synthetic local test program.' })
      await editor.getByRole('button', { name: 'Save program', exact: true }).click()
      await expect(page.locator('.success-notice')).toBeVisible()
    },
    Expenses: async () => {
      const vendor = form('Add vendor')
      await fill(vendor, { 'Name *': `UI vendor ${tag}` })
      await vendor.getByRole('button', { name: 'Save vendor', exact: true }).click()
      await expect(page.locator('.success-notice')).toBeVisible()
      const category = form('Add category')
      await fill(category, { 'Name *': `UI expense category ${tag}` })
      await category.getByRole('button', { name: 'Save category', exact: true }).click()
      const bill = form('Create bill')
      await fill(bill, { 'Bill number *': `UI-${tag}`, 'Amount *': '100', 'Purpose *': 'Synthetic test bill; no actual money.' })
      await bill.getByRole('combobox', { name: 'Vendor *', exact: true }).selectOption({ label: `UI vendor ${tag}` })
      await bill.getByRole('combobox', { name: 'Category *', exact: true }).selectOption({ label: `UI expense category ${tag}` })
      await bill.getByRole('button', { name: 'Create bill', exact: true }).click()
      await expect(page.locator('table').first()).toContainText(`UI-${tag}`)
    },
    'Reports & Exports': async () => {
      for (const button of await page.locator('.reports-report-picker button').all()) {
        await button.click()
        await download(page.getByRole('button', { name: 'Download CSV', exact: true }), 'csv')
      }
      await download(page.getByRole('button', { name: 'Download XLSX', exact: true }), 'xlsx')
      await download(page.getByRole('button', { name: 'Download PDF', exact: true }), 'pdf')
    },
  }
  let resume = !env.LOCAL_WORKFLOW_RESUME
  for (const [name, action] of Object.entries(steps)) {
    if (name === env.LOCAL_WORKFLOW_RESUME) resume = true
    if (!resume) continue
    await test.step(name, async () => {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name, exact: true }).click()
      await expect(page.locator('.dashboard-header h1')).toHaveText(name)
      await expect(page.locator('.loading-grid')).toBeHidden()
      await action()
      await expect(page.locator('.form-error,.api-notice')).toHaveCount(0)
      await page.screenshot({ path: testInfo.outputPath(`${name.replace(/[^a-z]/gi, '-')}.png`), fullPage: true })
    })
  }
  expect(errors).toEqual([])
})
