import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { languageOptions, translateNav, translateUi } from '../src/lib/i18n.js'
import { localRolePages, ROLE_PAGE_ACCESS } from '../src/lib/roleAccess.js'

const mojibake = /(?:Ã.|Â.|à¤|à¦|à°|à®|â€¦)/u
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('release role matrix covers the six client-demo accounts safely', () => {
  for (const role of ['super_admin', 'School Admin', 'Teacher', 'Accounts Staff', 'Parent', 'Student']) {
    assert.ok(ROLE_PAGE_ACCESS[role], `${role} is missing from the React role matrix`)
    assert.ok(localRolePages(role).includes('overview'), `${role} should have an overview`)
  }

  assert.ok(localRolePages('School Admin').includes('admissions'))
  assert.ok(localRolePages('School Admin').includes('finance'))
  assert.ok(localRolePages('Teacher').includes('attendance'))
  assert.ok(localRolePages('Accounts Staff').includes('finance'))
  for (const role of ['Teacher', 'Parent', 'Student']) {
    assert.equal(localRolePages(role).includes('finance'), false, `${role} must not see finance`)
    assert.equal(localRolePages(role).includes('admissions'), false, `${role} must not see admissions`)
  }
  assert.equal(localRolePages('super_admin').includes('students'), false)
})

test('release localization renders real Unicode Hindi for critical demo labels', () => {
  const hindi = languageOptions.find(item => item.value === 'hi')
  assert.ok(hindi)
  assert.equal(hindi.native, '\u0939\u093f\u0928\u094d\u0926\u0940')
  assert.equal(translateNav('hi', 'Overview'), '\u0905\u0935\u0932\u094b\u0915\u0928')

  for (const label of ['User directory', 'Teacher', 'Parent', 'Accounts Staff', 'Download PDF', 'Download XLSX']) {
    const translated = translateUi('hi', label)
    assert.notEqual(translated, label, `${label} should not fall back to English`)
    assert.doesNotMatch(translated, mojibake, `${label} contains mojibake`)
    assert.match(translated, /[\u0900-\u097F]/u, `${label} should contain Devanagari text`)
  }
})

test('release accessibility and session contracts remain wired into the app shell', () => {
  const app = source('src/App.jsx')
  const dialog = source('src/components/ConfirmationDialog.jsx')
  assert.match(app, /aria-live="polite"/)
  assert.match(app, /session/i)
  assert.match(dialog, /role="alertdialog"/)
  assert.match(dialog, /aria-modal="true"/)
})
