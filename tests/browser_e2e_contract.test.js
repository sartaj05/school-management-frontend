import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('browser E2E suite declares the release-critical scenarios', () => {
  const source = readFileSync(new URL('../e2e/release_smoke.spec.js', import.meta.url), 'utf8')
  for (const marker of ['logs in', 'CRUD', 'fee management', 'notification queue', 'offline error boundary']) {
    assert.match(source, new RegExp(marker, 'i'))
  }
})
