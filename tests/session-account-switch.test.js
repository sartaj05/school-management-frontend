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

for (const type of ['json', 'blob']) test(`account switch while consuming ${type} rejects stale data`, () => scenario(async ({ api, blobApi }, store, switchAccount) => {
  let finish, started
  const reading = new Promise(resolve => { started=resolve })
  globalThis.fetch = async () => ({ok:true,status:200,[type]:()=>new Promise(resolve=>{finish=resolve;started()})})
  const request = type==='json' ? api('/private') : blobApi('/private')
  await reading; switchAccount(); finish(type==='json'?{owner:'A'}:new Blob(['A']))
  await assert.rejects(request,error=>error.status===409)
}))

test('access-token-only account switches are detected', () => scenario(async ({ api }, store) => {
  store.delete('school_refresh_token')
  let finish
  globalThis.fetch=()=>new Promise(resolve=>{finish=resolve})
  const request=api('/private')
  store.set('school_access_token','B-super-admin')
  finish(Response.json({owner:'A'}))
  await assert.rejects(request,error=>error.status===409)
}))

test('expired access-only sessions clear authentication and notify the app', () => scenario(async ({ api }, store) => {
  store.delete('school_refresh_token')
  store.set('school_session', '{"user":{"role":"super_admin"}}')
  store.set('school_session_id', 'admin-session')
  const events = []
  globalThis.window = { dispatchEvent: event => events.push(event.type) }
  globalThis.fetch = async () => Response.json({ msg: 'Token has expired' }, { status: 401 })
  await assert.rejects(api('/dashboard/home'), error => error.status === 401)
  for (const key of ['school_access_token', 'school_refresh_token', 'school_session', 'school_session_id']) assert.equal(store.has(key), false)
  assert.deepEqual(events, ['school-session-expired'])
}))

test('invalid login credentials do not expire an existing access-only session', () => scenario(async ({ schoolApi }, store) => {
  store.delete('school_refresh_token')
  globalThis.fetch = async () => Response.json({ message: 'Invalid password' }, { status: 401 })
  await assert.rejects(schoolApi.superAdminLogin({}), error => error.status === 401)
  assert.equal(store.get('school_access_token'), 'A-access')
}))

test('late access-only 401 body cannot clear a new account', () => scenario(async ({ api }, store, switchAccount) => {
  store.delete('school_refresh_token')
  let finish, reading
  const started = new Promise(resolve => { reading = resolve })
  globalThis.fetch = async () => ({ ok: false, status: 401, json: () => new Promise(resolve => { finish = resolve; reading() }) })
  const pending = api('/dashboard/home')
  await started
  switchAccount()
  finish({ message: 'Expired' })
  await assert.rejects(pending, error => error.status === 409)
  assert.equal(store.get('school_access_token'), 'B-access')
}))

for (const status of [429, 502, 503, 'offline']) test(`temporary refresh failure ${status} preserves credentials and does not replay a write`, () => scenario(async ({ api }, store) => {
  let writes = 0
  globalThis.fetch = async url => {
    if (!url.endsWith('/auth/refresh')) { writes++; return Response.json({ msg: 'Expired' }, { status: 401 }) }
    if (status === 'offline') throw new TypeError('Network failed')
    return new Response('<html>Temporarily unavailable</html>', { status })
  }
  await assert.rejects(api('/save', { method: 'POST', body: '{}' }), error => error.data?.code === 'refresh_unavailable')
  assert.equal(writes, 1)
  assert.equal(store.get('school_access_token'), 'A-access')
  assert.equal(store.get('school_refresh_token'), 'A-refresh')
  globalThis.fetch = async (url, options) => url.endsWith('/auth/refresh')
    ? Response.json({ token: 'A-new', refresh_token: 'A-rotated' })
    : options.headers.Authorization === 'Bearer A-access'
      ? Response.json({ msg: 'Expired' }, { status: 401 }) : Response.json({ success: true })
  assert.deepEqual(await api('/save', { method: 'POST', body: '{}' }), { success: true })
  assert.equal(store.get('school_refresh_token'), 'A-rotated')
}))

test('rejected refresh expires the session instead of leaving unusable credentials', () => scenario(async ({ api }, store) => {
  const events = []
  globalThis.window = { dispatchEvent: e => events.push(e.type) }
  globalThis.fetch = async () => Response.json({ message: 'Revoked session' }, { status: 401 })
  await assert.rejects(api('/dashboard/home'), error => error.status === 401)
  assert.equal(store.has('school_access_token'), false)
  assert.equal(store.has('school_refresh_token'), false)
  assert.deepEqual(events, ['school-session-expired'])
}))
