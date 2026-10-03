import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('meeting screen exposes reminder scheduling and booking visibility', () => {
  const screen = source('src/components/ParentTeacherMeetings.jsx')
  const api = source('src/lib/api.js')
  assert.match(api, /createMeetingBooking/)
  assert.match(screen, /5, 3, and 1 day before each meeting/)
  assert.match(screen, /reminder_count/)
  assert.match(screen, /next_reminder_at/)
})
