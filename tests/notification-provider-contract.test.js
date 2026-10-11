import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('notification console exposes provider-level delivery tracking', () => {
  const api = source('src/lib/api.js')
  const screen = source('src/components/NotificationQueue.jsx')
  assert.match(api, /notificationAnalytics/)
  for (const contract of ['by_channel', 'Delivery by channel', 'Provider setup', 'View audit']) {
    assert.match(screen, new RegExp(contract))
  }
})
