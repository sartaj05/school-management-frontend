import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('confirmation dialog exposes a keyboard and screen-reader contract', () => {
  const dialog = source('src/components/ConfirmationDialog.jsx')
  assert.match(dialog, /role="alertdialog"/)
  assert.match(dialog, /aria-modal="true"/)
  assert.match(dialog, /aria-labelledby="confirm-title"/)
  assert.match(dialog, /querySelectorAll\('button,\[href\],input,select,textarea/)
})

test('global feedback and accessibility controls expose accessible names', () => {
  const app = source('src/App.jsx')
  assert.match(app, /role="status" aria-live="polite"/)
  assert.match(app, /aria-label=\{copy\.language\}/)
  assert.match(app, /aria-label=\{copy\.close\}/)
})
