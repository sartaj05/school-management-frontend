export function openFeePayment(invoiceId) {
  const url = `/fee-payment?invoice=${encodeURIComponent(invoiceId)}`
  const tab = window.open('about:blank', '_blank')
  if (!tab) { window.location.assign(url); return }
  // Copy only this session to the same-origin blank tab, then sever its opener.
  for (const key of ['school_access_token', 'school_refresh_token', 'school_session']) {
    const value = sessionStorage.getItem(key)
    if (value) tab.sessionStorage.setItem(key, value)
  }
  tab.opener = null
  tab.location.replace(url)
}

export function upiPaymentUrl(settings, amount, feeName) {
  return `upi://pay?${new URLSearchParams({ pa: settings.upi_id, pn: settings.payee_name, am: Number(amount).toFixed(2), cu: 'INR', tn: feeName })}`
}
