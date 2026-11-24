import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

async function scenario(run) {
  const original = { fetch: globalThis.fetch, sessionStorage: globalThis.sessionStorage, window: globalThis.window }
  const store = new Map([['school_access_token', 'A-access'], ['school_refresh_token', 'A-refresh']])
  globalThis.sessionStorage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) }
  globalThis.window = { dispatchEvent() {} }
  const source = readFileSync(new URL('../src/lib/api.js', import.meta.url), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', "''")
  try {
    const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)
    await run(api, store)
  } finally { Object.assign(globalThis, original) }
}

for (const body of ['<html>Proxy fallback</html>', '{"truncated":', '', '{}', 'null', '"ok"']) {
  test(`successful HTTP status rejects invalid API payload ${JSON.stringify(body)}`, () => scenario(async ({ api }) => {
    let calls = 0
    globalThis.fetch = async () => { calls++; return new Response(body, { status: 200 }) }
    await assert.rejects(api('/class/create', { method: 'POST', body: '{}' }), error => error.status === 502 && error.data.code === 'invalid_response')
    assert.equal(calls, 1, 'uncertain writes must not retry automatically')
  }))
}

test('create forms require the expected success marker and message', () => scenario(async ({ schoolApi }) => {
  for (const call of [schoolApi.createStudent, schoolApi.createClass, schoolApi.createUser, schoolApi.createSchool]) {
    globalThis.fetch = async () => Response.json({ arbitrary: 'unexpected' })
    await assert.rejects(call({}), error => error.status === 502)
    globalThis.fetch = async () => Response.json({ success: true, message: 'Created', data: { id: 7 } }, { status: 201 })
    assert.equal((await call({})).data.id, 7)
  }
}))

test('explicit application failure is not treated as successful HTTP 200', () => scenario(async ({ api }) => {
  globalThis.fetch = async () => Response.json({ success: false, message: 'Not saved' })
  await assert.rejects(api('/save'), error => error.message === 'Not saved')
}))

test('intentional no-content and empty lists remain supported', () => scenario(async ({ api }) => {
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.deepEqual(await api('/delete', { method: 'DELETE' }), {})
  globalThis.fetch = async () => Response.json([])
  assert.deepEqual(await api('/list'), [])
}))

test('login rejects missing credentials and role', () => scenario(async ({ schoolApi }) => {
  for (const call of [schoolApi.schoolLogin, schoolApi.superAdminLogin]) {
    globalThis.fetch = async () => Response.json({ success: true, user: {} })
    await assert.rejects(call({}), error => error.status === 502)
  }
}))

test('malformed refresh never persists undefined credentials or replays a write', () => scenario(async ({ api }, store) => {
  let writes = 0
  globalThis.fetch = async url => {
    if (url.endsWith('/auth/refresh')) return Response.json({ token: 'new-without-refresh' })
    writes++
    return Response.json({ message: 'Expired' }, { status: 401 })
  }
  await assert.rejects(api('/save', { method: 'POST' }))
  assert.equal(writes, 1)
  assert.equal(store.has('school_access_token'), false)
  assert.equal(store.has('school_refresh_token'), false)
}))
