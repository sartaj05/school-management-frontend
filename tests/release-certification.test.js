import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isWithinJavaScriptBudget, RELEASE_BUDGETS } from '../src/lib/releaseCertification.js'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('release certification keeps role, tenant and accessibility contracts connected', () => {
  const access = source('src/lib/roleAccess.js')
  const app = source('src/App.jsx')
  const api = source('src/lib/api.js')
  assert.match(access, /School Admin/)
  assert.match(access, /Teacher/)
  assert.match(access, /Parent/)
  assert.match(app, /aria-live/)
  assert.match(api, /Authorization/)
})

test('release budgets reject an oversized initial bundle', () => {
  assert.equal(isWithinJavaScriptBudget(RELEASE_BUDGETS.initialJavaScriptKb * 1024), true)
  assert.equal(isWithinJavaScriptBudget(RELEASE_BUDGETS.initialJavaScriptKb * 1024 + 1), false)
  assert.equal(isWithinJavaScriptBudget(-1), false)
})

test('release certification includes tenant isolation and mobile handoff evidence', () => {
  const guide = source('../Flak-API---For-School-Management-System-app/docs/RELEASE_CERTIFICATION.md')
  assert.match(guide, /tenant-isolation/)
  assert.match(guide, /Flutter widget and API contract tests/)
})

test('transport UI exposes provider readiness instead of hiding ETA fallback', () => {
  const api = source('src/lib/api.js')
  const transport = source('src/components/TransportManagement.jsx')
  assert.match(api, /transportReadiness/)
  assert.match(transport, /road_eta_configured/)
  assert.match(transport, /straight-line fallback/)
})
