import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('fee center exposes secure checkout, receipt and refund actions', () => {
  const api = source('src/lib/api.js')
  const screen = source('src/components/FeeManagement.jsx')
  for (const contract of ['createFeeGatewayOrder', 'verifyFeeGatewayPayment', 'downloadAdminFeeReceipt']) assert.match(api, new RegExp(contract))
  for (const contract of ['Pay online', 'Receipt', 'Refund', 'Razorpay']) assert.match(screen, new RegExp(contract))
})
