import test from 'node:test'
import assert from 'node:assert/strict'
import { mobileSchoolLink, configuredSchoolLink, schoolLinkFallback } from '../src/lib/schoolLinks.js'
const jwt = `x.${btoa(JSON.stringify({ schema_context: 'school_a' }))}.x`
test('school links include tenant and record without credentials', () => {
  assert.equal(mobileSchoolLink('fees', 8, jwt), 'eduflow://open/fees?school=school_a&invoice=8')
  assert.equal(mobileSchoolLink('child', -1, jwt), null)
  assert.equal(mobileSchoolLink('login', 1, jwt), null)
  assert.equal(mobileSchoolLink('child', 1, 'bad'), null)
  assert.equal(mobileSchoolLink('document', 'a'.repeat(48), null), `eduflow://open/document?token=${'a'.repeat(48)}`)
})

test('unconfigured app links retain the custom scheme and an explicit browser fallback', () => {
  const link=mobileSchoolLink('fees',8,jwt)
  assert.equal(schoolLinkFallback(link),'/app/fees?school=school_a&invoice=8')
  assert.equal(configuredSchoolLink(link,''),link)
  assert.equal(configuredSchoolLink(link,'portal.myschool.edu'),'https://portal.myschool.edu/app/fees?school=school_a&invoice=8')
  assert.equal(configuredSchoolLink(link,'https://bad.test'),link)
  assert.equal(configuredSchoolLink(link,'example.com'),link)
  assert.equal(schoolLinkFallback('javascript:alert(1)'),null)
})
