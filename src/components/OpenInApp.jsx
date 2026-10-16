import { mobileSchoolLink } from '../lib/schoolLinks'

export default function OpenInApp({ destination, id }) {
  const href = mobileSchoolLink(destination, id)
  return href ? <p><a href={href}>Open in EduFlow app</a><small> · Requires the installed mobile app and the matching school account.</small></p> : null
}
