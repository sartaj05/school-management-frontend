import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateSettlement } from '../src/lib/financeSettlement.js'

test('calculates the expected daily balance and zero variance', () => {
  assert.deepEqual(calculateSettlement({ openingBalance: 1000, income: 100, expenses: 20, refunds: 0, countedBalance: 1080 }), {
    expectedBalance: 1080,
    variance: 0,
  })
})

test('leaves variance open until a counted balance is provided', () => {
  assert.deepEqual(calculateSettlement({ openingBalance: 250, income: 50, expenses: 10 }), {
    expectedBalance: 290,
    variance: null,
  })
})
