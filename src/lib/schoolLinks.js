export function mobileSchoolLink(destination, id, token = sessionStorage.getItem('school_access_token')) {
  if (destination === 'document') return /^[a-f0-9]{48}$/.test(id) ? `eduflow://open/document?token=${id}` : null
  if (!['fees', 'child'].includes(destination) || !/^[1-9]\d*$/.test(String(id))) return null
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')))
    if (!/^[a-zA-Z0-9_]{1,63}$/.test(claims.schema_context)) return null
    const query = new URLSearchParams({ school: claims.schema_context, [destination === 'fees' ? 'invoice' : 'student']: id })
    return `eduflow://open/${destination}?${query}`
  } catch { return null }
}

export function schoolLinkFallback(customLink) {
  if(!customLink?.startsWith('eduflow://open/'))return null
  const parsed=new URL(customLink)
  return `/app${parsed.pathname}${parsed.search}`
}

export function configuredSchoolLink(customLink, host=import.meta.env?.VITE_APP_LINK_HOST) {
  const fallback=schoolLinkFallback(customLink)
  if(!fallback)return null
  if(!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(host) || /(?:example|invalid|localhost)/i.test(host))return customLink
  return `https://${host}${fallback}`
}
