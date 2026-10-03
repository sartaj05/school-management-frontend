import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('React gated navigation fails closed while server entitlements load', () => {
  const source = readFileSync(new URL('../src/pages/DashboardPage.jsx', import.meta.url), 'utf8')
  assert.match(source, /const serverEnabled = name => isSuper \|\| \(featureMatrix \? featureMatrix\[name\]\?\.enabled === true : false\)/)
  assert.doesNotMatch(source, /localPlanAllows/)
})
