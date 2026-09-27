import test from 'node:test'
import assert from 'node:assert/strict'
import { localRolePages, ROLE_PAGE_ACCESS } from '../src/lib/roleAccess.js'

test('every supported role has an overview and no duplicate pages', () => {
  for (const [role, pages] of Object.entries(ROLE_PAGE_ACCESS)) {
    assert.ok(pages.includes('overview'), `${role} should see overview`)
    assert.equal(new Set(pages).size, pages.length, `${role} contains duplicate pages`)
  }
})

test('role fallback does not expose tenant management pages', () => {
  assert.deepEqual(localRolePages('unknown-role'), ['overview'])
  assert.ok(localRolePages('Teacher').includes('students'))
  assert.ok(!localRolePages('Teacher').includes('users'))
  assert.ok(localRolePages('Accounts Staff').includes('finance'))
  assert.ok(!localRolePages('Parent').includes('finance'))
})

test('tenant roles cannot navigate platform administration pages', () => {
  const platformPages = new Set(['publicWebsite', 'schools', 'users', 'maintenance'])
  for (const role of ['School Admin', 'Teacher', 'Parent', 'Student', 'Accounts Staff', 'Hostel Staff']) {
    assert.equal(localRolePages(role).some(page => platformPages.has(page)), false, role)
  }
})

test('super admin navigation is limited to platform administration', () => {
  assert.deepEqual(new Set(localRolePages('super_admin')), new Set([
    'overview', 'publicWebsite', 'schools', 'users', 'maintenance',
  ]))
})

test('school admin navigation covers every client demo workflow', () => {
  const pages = new Set(localRolePages('School Admin'))
  for (const featurePages of [
    ['students', 'teachers', 'parents', 'classes'],
    ['attendance', 'exams', 'assignments', 'timetable'],
    ['fees', 'finance'],
    ['admissions'],
    ['leave', 'payroll', 'inventory', 'hostel'],
  ]) {
    for (const page of featurePages) assert.ok(pages.has(page), page)
  }
})

test('demo roles cannot receive another role\'s sensitive workflows', () => {
  const staffAdministration = new Set(['admissions', 'finance', 'fees', 'payroll', 'inventory', 'hostel'])
  for (const role of ['Teacher', 'Parent', 'Student']) {
    assert.equal(localRolePages(role).some(page => staffAdministration.has(page)), false, role)
  }
})
