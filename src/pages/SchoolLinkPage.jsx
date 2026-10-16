import { Link, useParams, useSearchParams } from 'react-router-dom'
import { draftScope } from '../lib/offlineDrafts'

export default function SchoolLinkPage() {
  const { destination } = useParams(), [query] = useSearchParams()
  const token = query.get('token'), school = query.get('school'), id = query.get(destination === 'fees' ? 'invoice' : 'student')
  const valid = destination === 'document' ? /^[a-f0-9]{48}$/.test(token || '') : ['fees', 'child'].includes(destination) && /^[a-zA-Z0-9_]{1,63}$/.test(school || '') && /^[1-9]\d*$/.test(id || '')
  const safe = new URLSearchParams(destination === 'document' ? { token } : { school, [destination === 'fees' ? 'invoice' : 'student']: id })
  const sameSchool = draftScope()?.split(':')[0] === school
  const browser = destination === 'document' ? `/verify-document/${token}` : destination === 'fees' ? `/fee-payment?invoice=${id}` : '/dashboard'
  return <main style={{ maxWidth: 640, margin: '40px auto', padding: 24 }}><h1>Open your school record</h1>{valid ? <><p><a href={`eduflow://open/${destination}?${safe}`}>Open in EduFlow app</a></p>{sameSchool || destination === 'document' ? <Link to={browser}>Continue on the website</Link> : <p>Sign in to the matching school account, then reopen this link. <Link to="/login">Go to sign in</Link></p>}</> : <p role="alert">This school link is invalid.</p>}</main>
}
