import fs from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('sends the server challenge and authenticator code during school login', () => {
    const source = read('src/pages/LoginPage.jsx')
    assert.match(source, /mfa_required/)
    assert.match(source, /mfa_token/)
    assert.match(source, /mfa_code/)
    assert.match(source, /Verify code/)
})

test('exposes setup, enable and disable endpoints for account security', () => {
    const api = read('src/lib/api.js')
    assert.match(api, /mfaStatus: \(\) => api\('\/auth\/mfa\/status'\)/)
    assert.match(api, /mfaSetup: \(\) => api\('\/auth\/mfa\/setup'/)
    assert.match(api, /mfaEnable: \(code\) => api\('\/auth\/mfa\/enable'/)
    assert.match(api, /mfaDisable: \(code\) => api\('\/auth\/mfa\/disable'/)
})
