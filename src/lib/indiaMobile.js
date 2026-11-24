/** Format Indian numbers consistently while preserving all ten national digits. */
export function normalizeIndiaMobile(value) {
  const input = String(value || '').trim()
  const digits = input.replace(/\D/g, '')
  const hasCountryCode = /^\+91/.test(input) || /^0091/.test(input) || (digits.length > 10 && digits.startsWith('91'))
  // Strip one prefix only: national numbers may themselves begin with 91.
  // Keep extra digits so validation can reject them instead of changing contact details.
  const national = hasCountryCode
    ? digits.replace(/^(?:0091|91)/, '')
    : digits
  return national ? `+91${national}` : input ? '+91' : ''
}

export function isValidIndiaMobile(value) {
  return /^\+91[6-9]\d{9}$/.test(String(value || ''))
}
