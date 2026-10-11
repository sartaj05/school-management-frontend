import { expect } from '@playwright/test'

export async function exerciseRolePage(page, name, role, tag) {
  const main = page.locator('.dashboard-content')
  for (const input of await main.locator('input[placeholder^="Search"]').all()) {
    if (!await input.isVisible() || await input.locator('xpath=ancestor::form').count()) continue
    const original = await input.inputValue()
    await input.fill('Demo')
    await page.waitForTimeout(250)
    await input.fill(original)
  }
  for (const button of await main.getByRole('button', { name: /^Refresh( status| data| report| list| history)?$/i }).all()) {
    if (await button.isVisible() && await button.isEnabled()) {
      await button.click()
      await expect(button).toBeEnabled()
    }
  }
  if (role === 'admin' && name === 'Calendar') {
    await page.getByRole('button', { name: 'Add event', exact: true }).click()
    const form = page.locator('form.editor-card')
    await form.getByLabel('Title *', { exact: true }).fill(`Local browser event ${tag}`)
    await form.getByLabel('Starts *', { exact: true }).fill('2026-11-02T09:00')
    await form.getByLabel('Ends *', { exact: true }).fill('2026-11-02T10:00')
    await form.getByRole('combobox', { name: 'Status', exact: true }).selectOption('published')
    await form.getByRole('button', { name: 'Create event', exact: true }).click()
    await expect(page.locator('.calendar-event-grid')).toContainText(`Local browser event ${tag}`)
  }
  if (['admin', 'teacher'].includes(role) && name === 'Assignments') {
    const form = page.locator('form.editor-card')
    await form.getByLabel('Title *', { exact: true }).fill(`Local browser homework ${tag}`)
    await form.getByRole('combobox', { name: 'Class *', exact: true }).selectOption({ index: 1 })
    await form.getByRole('combobox', { name: 'Subject *', exact: true }).selectOption({ index: 1 })
    await form.getByLabel('Instructions *', { exact: true }).fill('Synthetic test homework: explain one thing you learned today.')
    await form.getByRole('button', { name: 'Create draft', exact: true }).click()
    const assignment = page.locator('.assignment-list article').filter({ hasText: `Local browser homework ${tag}` })
    await expect(assignment).toBeVisible()
    await assignment.getByRole('button', { name: 'Publish', exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'published', exact: true }).click()
    await expect(assignment.locator('.delivery-status')).toHaveText('published')
    await assignment.getByRole('button', { name: 'Students', exact: true }).click()
    await expect(page.getByText('Submission register', { exact: true })).toBeVisible()
  }
  if (role === 'admin' && name === 'Library') {
    const form = page.locator('form.editor-card').first()
    await form.getByLabel('Title *', { exact: true }).fill(`Local browser book ${tag}`)
    await form.getByLabel('Author *', { exact: true }).fill('Synthetic Test Author')
    await form.getByRole('button', { name: 'Add book', exact: true }).click()
    const book = page.locator('.library-book-grid article').filter({ hasText: `Local browser book ${tag}` })
    await book.getByRole('button', { name: 'Issue', exact: true }).click()
    const issue = page.locator('form.editor-card').last()
    await issue.getByRole('combobox', { name: 'Student *', exact: true }).selectOption({ index: 1 })
    await issue.getByRole('button', { name: 'Issue book', exact: true }).click()
    const loan = page.locator('.library-loans tr').filter({ hasText: `Local browser book ${tag}` })
    await loan.getByRole('button', { name: 'Return', exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Return book', exact: true }).click()
    await expect(loan.locator('.delivery-status')).toHaveText('returned')
  }
  if (role === 'admin' && name === 'Classes') {
    await page.getByRole('button', { name: 'Add class', exact: true }).click()
    const form = page.locator('form.editor-card')
    await form.getByLabel('Class name', { exact: true }).fill(`UI ${tag}`)
    await form.getByLabel('Description', { exact: true }).fill('Synthetic class created during browser verification.')
    await form.getByRole('button', { name: 'Create class', exact: true }).click()
    await expect(page.locator('.success-notice')).toBeVisible()
  }
  if (['admin', 'teacher'].includes(role) && name === 'Documents') {
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download attendance CSV', exact: true }).click()
    expect((await download).suggestedFilename()).toMatch(/\.csv$/)
  }
  if (name === 'Settings') {
    await page.getByRole('button', { name: 'Save profile', exact: true }).click()
    await expect(page.locator('.profile-update-message.success-notice')).toBeVisible()
  }
  if (['student', 'parent'].includes(role) && name === 'My Portal') {
    const tabs = await page.locator('.portal-tabs button').allTextContents()
    for (const tab of tabs) {
      await page.locator('.portal-tabs').getByRole('button', { name: tab, exact: true }).click()
      await expect(page.locator('.loading-grid')).toBeHidden()
      await page.waitForTimeout(250)
      await expect(page.locator('.form-error')).toHaveCount(0)
      if (role === 'student' && tab === 'Assignments') {
        const row = page.locator('.portal-action-panel tr').filter({ hasText: 'Local browser homework' }).first()
        if (await row.count() && await row.getByRole('button', { name: 'Submit homework', exact: true }).isEnabled()) {
          await row.getByPlaceholder('Write your answer').fill('Synthetic browser test answer: practice helps learning.')
          await row.getByRole('button', { name: 'Submit homework', exact: true }).click()
          await expect(row.locator('.portal-action-status')).toContainText('submitted')
        }
      }
    }
  }
}
