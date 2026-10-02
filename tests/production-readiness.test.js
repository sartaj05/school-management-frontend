import test from 'node:test'
import assert from 'node:assert/strict'
import { languageOptions, translateNav, translateUi } from '../src/lib/i18n.js'
import { localRolePages, ROLE_PAGE_ACCESS } from '../src/lib/roleAccess.js'

const mojibake = /[ÃÂâ�]/
const platformPages = new Set(['publicWebsite', 'schools', 'maintenance'])

test('every supported language has readable high-traffic navigation labels', () => {
  for (const language of languageOptions) {
    for (const label of ['Overview', 'Attendance', 'Students', 'Settings']) {
      const translated = translateNav(language.value, label)
      assert.ok(translated, `${language.value}:${label} is empty`)
      assert.doesNotMatch(translated, mojibake, `${language.value}:${label} contains encoding artifacts`)
    }
  }
})

test('every tenant role stays outside platform administration pages', () => {
  for (const role of Object.keys(ROLE_PAGE_ACCESS).filter(role => role !== 'super_admin')) {
    assert.equal(localRolePages(role).some(page => platformPages.has(page)), false, role)
  }
})

test('demo-critical labels remain translated in Hindi', () => {
  for (const label of ['Teacher', 'Parent', 'Accounts Staff', 'Download PDF', 'Download XLSX']) {
    const translated = translateUi('hi', label)
    assert.notEqual(translated, label, `${label} fell back to English`)
    assert.doesNotMatch(translated, mojibake, `${label} contains encoding artifacts`)
  }
})
