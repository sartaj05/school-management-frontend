import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')

test('public admissions supports privacy-safe application status tracking', () => {
  const api = source('src/lib/api.js')
  const page = source('src/pages/AdmissionPage.jsx')
  assert.match(api, /admissionPublicStatus/)
  for (const contract of ['Check application status', 'application_no', 'guardian_mobile', 'admissionPublicStatus']) {
    assert.match(page, new RegExp(contract))
  }
})
