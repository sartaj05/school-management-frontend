import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('super admin branch management is connected to the API and navigation', () => {
  const api = source('src/lib/api.js')
  const access = source('src/lib/roleAccess.js')
  const dashboard = source('src/pages/DashboardPage.jsx')
  const screen = source('src/components/BranchManagement.jsx')
  for (const contract of ['branches', 'createBranch', 'consolidatedBranches']) assert.match(api, new RegExp(contract))
  assert.match(access, /branches/)
  assert.match(dashboard, /BranchManagement/)
  for (const contract of ['School group branches', 'Register a branch', 'Tenant isolation remains enforced']) {
    assert.match(screen, new RegExp(contract))
  }
  for (const field of ['summary.income', 'summary.expenses', 'summary.net', 'summary.unreconciled']) {
    assert.match(screen, new RegExp(field.replace('.', '\\.'), 'u'))
  }
})
