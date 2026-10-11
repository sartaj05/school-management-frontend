import test from 'node:test'
import assert from 'node:assert/strict'
import { CORE_RELEASE_ROLES, coreRolePageMatrix, localRolePages, ROLE_PAGE_ACCESS } from '../src/lib/roleAccess.js'

const CORE_ROLE_EXPECTATIONS = {
  super_admin: ['overview', 'publicWebsite', 'schools', 'branches', 'users', 'maintenance'],
  'School Admin': ['overview', 'onboarding', 'reports', 'scheduledReports', 'people', 'academics', 'academicYears', 'analytics', 'calendar', 'meetings', 'messages', 'hostel', 'audit', 'admissions', 'inventory', 'staffHr', 'payroll', 'scholarships', 'expenses', 'finance', 'transport', 'leave', 'smartClassroom', 'documents', 'exams', 'fees', 'assignments', 'library', 'teacherAssignments', 'timetable', 'subjects', 'students', 'teachers', 'parents', 'classes', 'attendance', 'attendanceReports', 'portalLinks', 'notifications', 'users', 'settings'],
  Teacher: ['overview', 'academics', 'academicYears', 'analytics', 'calendar', 'meetings', 'messages', 'reports', 'smartClassroom', 'documents', 'exams', 'assignments', 'library', 'timetable', 'subjects', 'students', 'classes', 'attendance', 'attendanceReports', 'notifications', 'settings', 'leave', 'feeCollection'],
  'Accounts Staff': ['overview', 'reports', 'scheduledReports', 'fees', 'finance', 'scholarships', 'expenses', 'settings'],
  Parent: ['overview', 'portal', 'calendar', 'meetings', 'messages', 'documents', 'notifications', 'settings'],
  Student: ['overview', 'portal', 'calendar', 'messages', 'documents', 'notifications', 'leave', 'settings'],
}

test('core release matrix contains the complete six-role contract', () => {
  assert.deepEqual(new Set(CORE_RELEASE_ROLES), new Set(Object.keys(CORE_ROLE_EXPECTATIONS)))
  assert.deepEqual(coreRolePageMatrix(), CORE_ROLE_EXPECTATIONS)
  for (const pages of Object.values(coreRolePageMatrix())) {
    assert.equal(new Set(pages).size, pages.length)
    assert.ok(pages.includes('overview'))
  }
})

test('every supported role has an overview and no duplicate pages', () => {
  for (const [role, pages] of Object.entries(ROLE_PAGE_ACCESS)) {
    assert.ok(pages.includes('overview'), `${role} should see overview`)
    assert.equal(new Set(pages).size, pages.length, `${role} contains duplicate pages`)
  }
})

test('role fallback does not expose tenant management pages', () => {
  assert.deepEqual(localRolePages('unknown-role'), ['overview'])
  assert.ok(localRolePages('Teacher').includes('students'))
  assert.ok(localRolePages('Teacher').includes('academicYears'))
  assert.ok(!localRolePages('Teacher').includes('users'))
  assert.ok(localRolePages('Accounts Staff').includes('finance'))
  assert.ok(!localRolePages('Parent').includes('finance'))
})

test('tenant roles cannot navigate platform administration pages', () => {
  const platformPages = new Set(['publicWebsite', 'schools', 'maintenance'])
  for (const role of ['School Admin', 'Teacher', 'Parent', 'Student', 'Accounts Staff', 'Hostel Staff']) {
    assert.equal(localRolePages(role).some(page => platformPages.has(page)), false, role)
  }
})

test('school admin can navigate the tenant user directory', () => {
  assert.ok(localRolePages('School Admin').includes('users'))
})

test('super admin navigation is limited to platform administration', () => {
  assert.deepEqual(new Set(localRolePages('super_admin')), new Set([
    'overview', 'publicWebsite', 'schools', 'branches', 'users', 'maintenance',
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
