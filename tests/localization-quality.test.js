import test from 'node:test'
import assert from 'node:assert/strict'
import { languageOptions, translateNav, translateUi } from '../src/lib/i18n.js'

const mojibake = /(?:Ã.|Â.|à¤|à¦|à°|à®|â€¦)/u

test('supported language labels are valid Unicode and not mojibake', () => {
  assert.equal(languageOptions.find(item => item.value === 'hi').native, '\u0939\u093f\u0928\u094d\u0926\u0940')
  assert.equal(translateNav('hi', 'Overview'), '\u0905\u0935\u0932\u094b\u0915\u0928')
  assert.doesNotMatch(translateUi('hi', 'User directory'), mojibake)
  assert.match(translateUi('hi', 'User directory'), /[\u0900-\u097F]/u)
})

test('critical role and report labels have a Hindi translation', () => {
  for (const label of ['Teacher', 'Parent', 'Accounts Staff', 'Download PDF', 'Download XLSX']) {
    const translated = translateUi('hi', label)
    assert.notEqual(translated, label, `${label} should not fall back to English`)
    assert.doesNotMatch(translated, mojibake, `${label} contains mojibake`)
  }
})
