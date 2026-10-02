import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('School Admin has a tenant-scoped user directory', () => {
  const access = fs.readFileSync('src/lib/roleAccess.js', 'utf8')
  const api = fs.readFileSync('src/lib/api.js', 'utf8')
  const page = fs.readFileSync('src/pages/DashboardPage.jsx', 'utf8')

  assert.match(access, /'School Admin':[^\n]*'users'/)
  assert.match(api, /updateTenantUser:/)
  assert.match(api, /updateTenantUserStatus:/)
  assert.match(page, /schoolApi\.updateTenantUser\(/)
  assert.match(page, /schoolApi\.updateTenantUserStatus\(/)
})
