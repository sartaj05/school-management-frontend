import test from 'node:test'
import assert from 'node:assert/strict'
import { reportTimestamp } from '../src/lib/reportTime.js'

test('report timestamps preserve the instant for old UTC, explicit UTC and offset responses', () => {
  const expected = new Date('2026-11-23T04:30:00Z').toLocaleString()
  for (const value of ['2026-11-23T04:30:00', '2026-11-23T04:30:00Z', '2026-11-23T04:30:00+00:00', '2026-11-23T10:00:00+05:30']) {
    assert.equal(reportTimestamp(value), expected)
  }
})

test('missing and invalid report timestamps show an empty placeholder', () => {
  for (const value of [null, undefined, '', 'invalid']) assert.equal(reportTimestamp(value), '—')
})
