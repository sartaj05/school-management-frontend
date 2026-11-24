import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

for (const status of [200, 401, 500, 'offline']) test(`logout attempts both revocations after access result ${status} and preserves a new login`, async () => {
  const originals = { fetch: globalThis.fetch, sessionStorage: globalThis.sessionStorage }
  const store = new Map([['school_access_token', 'A-access'], ['school_refresh_token', 'A-refresh'], ['school_session', '{}']])
  globalThis.sessionStorage = { getItem: key => store.get(key) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) }
  const calls = [], finish = []
  globalThis.fetch = (url, options) => {
    calls.push({ url, token: options.headers.Authorization })
    return new Promise((resolve, reject) => finish.push(() => status === 'offline' ? reject(new TypeError('Offline')) : resolve(new Response(null, { status }))))
  }
  try {
    const source = readFileSync(new URL('../src/lib/api.js', import.meta.url), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', "''")
    const { schoolApi } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${status}`)
    const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
    const callback = app.match(/const logout=(async\(\)=>\{[^\n]+)/)[1]
    const logout = new Function('schoolApi', 'clearAllMarkDrafts', 'AUTH_STORAGE_KEYS', 'setSession', 'setFlash', `return ${callback}`)(
      schoolApi, () => {}, ['school_access_token', 'school_refresh_token', 'school_session', 'school_session_id'], () => {}, () => {})
    const pending = logout()
    assert.equal(store.size, 0, 'local sign-out must not wait for the server')
    assert.deepEqual(calls, [
      { url: '/api/v1/auth/logout/access', token: 'Bearer A-access' },
      { url: '/api/v1/auth/logout', token: 'Bearer A-refresh' },
    ])
    store.set('school_access_token', 'B-access')
    store.set('school_refresh_token', 'B-refresh')
    finish.forEach(resolve => resolve())
    await pending
    assert.equal(store.get('school_access_token'), 'B-access')
    assert.equal(store.get('school_refresh_token'), 'B-refresh')
  } finally { Object.assign(globalThis, originals) }
})
