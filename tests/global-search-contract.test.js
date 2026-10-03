import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('dashboard global search exposes module and record search contracts', () => {
  const api = source('src/lib/api.js')
  const page = source('src/pages/DashboardPage.jsx')
  assert.match(api, /globalSearch: \(query\)/)
  for (const contract of ['Search modules or records', 'aria-expanded={visible}', 'canSearchRecords']) {
    assert.match(page, new RegExp(contract.replace(/[{}]/g, '\\$&')))
  }
})
