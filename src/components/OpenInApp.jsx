import { mobileSchoolLink, configuredSchoolLink, schoolLinkFallback } from '../lib/schoolLinks'

export default function OpenInApp({ destination, id }) {
  const href = mobileSchoolLink(destination, id)
  return href ? <p><a href={configuredSchoolLink(href)}>Open in EduFlow app</a><small> · Requires the installed mobile app and the matching school account.</small> <a href={schoolLinkFallback(href)}>App or browser options</a></p> : null
}
