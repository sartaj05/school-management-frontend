import test from 'node:test'
import assert from 'node:assert/strict'
import { subscriptionForm, subscriptionPayload } from '../src/lib/subscription.js'

test('subscription editing preserves UTC dates and clears dates explicitly', () => {
  const form = subscriptionForm({ plan: 'premium', status: 'active', plan_ends_at: '2030-10-22T12:30:00' })
  form.reason = 'Annual renewal'
  assert.equal(subscriptionPayload(form).plan_ends_at, '2030-10-22T12:30:00.000Z')
  assert.equal(subscriptionPayload(form).trial_ends_at, null)
  form.plan_ends_at = ''
  assert.equal(subscriptionPayload(form).plan_ends_at, null)
})

test('subscription changes require a reason and reject invalid dates', () => {
  const form = subscriptionForm({})
  assert.throws(() => subscriptionPayload(form), /reason/)
  form.reason = 'Renewal'; form.plan_ends_at = 'invalid'
  assert.throws(() => subscriptionPayload(form), /valid/)
})

test('legacy and trial plans remain selectable', () => {
  assert.equal(subscriptionForm({plan:'Trial'}).plan, 'trial')
  assert.equal(subscriptionForm({plan:'Premium'}).plan, 'premium')
  assert.equal(subscriptionForm({plan:'Basic'}).plan, 'standard')
})
