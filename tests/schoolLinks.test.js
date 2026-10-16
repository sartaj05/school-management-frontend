import test from 'node:test'
import assert from 'node:assert/strict'
import { mobileSchoolLink } from '../src/lib/schoolLinks.js'
const jwt = `x.${btoa(JSON.stringify({ schema_context: 'school_a' }))}.x`
test('school links include tenant and record without credentials', () => {
  assert.equal(mobileSchoolLink('fees', 8, jwt), 'eduflow://open/fees?school=school_a&invoice=8')
  assert.equal(mobileSchoolLink('child', -1, jwt), null)
  assert.equal(mobileSchoolLink('login', 1, jwt), null)
  assert.equal(mobileSchoolLink('child', 1, 'bad'), null)
  assert.equal(mobileSchoolLink('document', 'a'.repeat(48), null), `eduflow://open/document?token=${'a'.repeat(48)}`)
})
