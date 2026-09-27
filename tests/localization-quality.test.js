import test from 'node:test'
import assert from 'node:assert/strict'
import { languageOptions, translateNav, translateUi } from '../src/lib/i18n.js'

test('supported language labels are valid Unicode and not mojibake', () => {
  assert.equal(languageOptions.find(item => item.value === 'hi').native, 'हिन्दी')
  assert.equal(translateNav('hi', 'Overview'), 'अवलोकन')
  assert.doesNotMatch(translateUi('hi', 'User directory'), /[ÃÂà]/)
})

test('critical role and report labels have a Hindi translation', () => {
  for (const label of ['Teacher', 'Parent', 'Accounts Staff', 'Download PDF', 'Download XLSX']) {
    const translated = translateUi('hi', label)
    assert.notEqual(translated, label, `${label} should not fall back to English`)
    assert.doesNotMatch(translated, /[ÃÂà]/, `${label} contains mojibake`)
  }
})
