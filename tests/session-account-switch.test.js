import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

async function scenario(run) {
  const originals = { fetch: globalThis.fetch, sessionStorage: globalThis.sessionStorage, window: globalThis.window }
  const store = new Map([['school_access_token', 'A-access'], ['school_refresh_token', 'A-refresh']])
  globalThis.sessionStorage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) }
  globalThis.window = { dispatchEvent() { throw new Error('The new account must not be logged out') } }
  const switchAccount = () => { store.set('school_access_token', 'B-access'); store.set('school_refresh_token', 'B-refresh') }
  const source = readFileSync(new URL('../src/lib/api.js', import.meta.url), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', "''")
  try {
    const module = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)
    await run(module, store, switchAccount)
  } finally { Object.assign(globalThis, originals) }
}

test('an old 401 cannot replay a write in a newly signed-in account', () => scenario(async ({ schoolApi }, store, switchAccount) => {
  let finish
  let calls = 0
  globalThis.fetch = () => { calls++; return new Promise(resolve => { finish = resolve }) }
  const request = schoolApi.createClass({ class_name: 'Account A class' })
  switchAccount()
  finish(Response.json({ message: 'Expired' }, { status: 401 }))
  await assert.rejects(request, error => error.status === 409)
  assert.equal(calls, 1)
  assert.equal(store.get('school_access_token'), 'B-access')
}))

test('late refresh success and failure cannot replace or clear the new session', async () => {
  for (const status of [200, 401]) await scenario(async ({ schoolApi }, store, switchAccount) => {
    let finishRefresh
    let started
    const refreshing = new Promise(resolve => { started = resolve })
    globalThis.fetch = async url => {
      if (url.endsWith('/auth/refresh')) return new Promise(resolve => { finishRefresh = resolve; started() })
      return Response.json({ message: 'Expired' }, { status: 401 })
    }
    const request = schoolApi.dashboard()
    await refreshing
    switchAccount()
    finishRefresh(Response.json({ token: 'A-new', refresh_token: 'A-rotated' }, { status }))
    await assert.rejects(request, error => error.status === 409)
    assert.equal(store.get('school_access_token'), 'B-access')
    assert.equal(store.get('school_refresh_token'), 'B-refresh')
  })
})

test('a late successful response is discarded after an account switch', () => scenario(async ({ schoolApi }, store, switchAccount) => {
  let finish
  globalThis.fetch = () => new Promise(resolve => { finish = resolve })
  const request = schoolApi.dashboard()
  switchAccount()
  finish(Response.json({ private_data: 'account A' }))
  await assert.rejects(request, error => error.status === 409)
  assert.equal(store.get('school_access_token'), 'B-access')
}))
