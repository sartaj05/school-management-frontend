import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeIndiaMobile, isValidIndiaMobile } from '../src/lib/indiaMobile.js'

test('Indian international prefixes are removed exactly once', () => {
  for (const value of ['9123456789', '+91 9123456789', '91 9123456789', '0091 9123456789']) {
    assert.equal(normalizeIndiaMobile(value), '+919123456789')
    assert.equal(isValidIndiaMobile(normalizeIndiaMobile(value)), true)
  }
})

test('extra digits remain invalid instead of becoming a different valid phone number', () => {
  for (const value of ['98765432101', '+9198765432101', '009198765432101']) {
    assert.equal(isValidIndiaMobile(normalizeIndiaMobile(value)), false)
    assert.equal(normalizeIndiaMobile(value), '+9198765432101')
  }
})

test('phone formatting supports empty and partial edits', () => {
  assert.equal(normalizeIndiaMobile(''), '')
  assert.equal(normalizeIndiaMobile('+91'), '+91')
  assert.equal(normalizeIndiaMobile('+91 98'), '+9198')
  assert.equal(normalizeIndiaMobile('98765 43210'), '+919876543210')
})
