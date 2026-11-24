/* eslint-disable react-hooks/set-state-in-effect */
import { Link2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { schoolApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function PortalLinkManager() {
  const [type, setType] = useState('parent'), [options, setOptions] = useState({users:[],profiles:[]}), [links, setLinks] = useState([])
  const [values, setValues] = useState({user_id:'',profile_id:''}), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const requestId = useRef(0)
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true); setError(''); setOptions({users:[],profiles:[]}); setValues({user_id:'',profile_id:''})
    try {
      const [available, current] = await Promise.all([schoolApi.portalLinkOptions(type), schoolApi.portalLinks()])
      if (id !== requestId.current) return
      setOptions({users:available.users || [],profiles:available.profiles || []}); setLinks(current.data || [])
    } catch (e) { if (id === requestId.current) setError(e.message) }
    finally { if (id === requestId.current) setLoading(false) }
  }, [type])
  const invalidateRequests = useCallback(() => { requestId.current++ }, [])
  useEffect(() => { load(); return invalidateRequests }, [load, invalidateRequests])
  function changeType(value) {
    requestId.current++
    setType(value); setValues({user_id:'',profile_id:''}); setOptions({users:[],profiles:[]}); setLoading(true); setNotice('')
  }
  async function submit(e) {
    e.preventDefault()
    if (busy || loading) return
    setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.createPortalLink({...values, profile_type:type}); setNotice(result.message); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function revoke(id) {
    if (busy || loading) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (!await confirmPopup({title:'Revoke portal link?',message:'The linked account will immediately lose access to this profile.',confirmLabel:'Revoke link'})) return
      const result = await schoolApi.revokePortalLink(id); setNotice(result.message); await load()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <><section className="people-hero"><div><span>School Admin</span><h2>Portal access links</h2><p>Connect a Parent or Student login to its matching school profile.</p></div><Link2/></section><form className="editor-card" onSubmit={submit}><div className="field-grid three"><label>Account type<select disabled={busy} value={type} onChange={e=>changeType(e.target.value)}><option value="parent">Parent</option><option value="student">Student</option></select></label><label>Login account<select required disabled={loading || busy} value={values.user_id} onChange={e=>setValues({...values,user_id:e.target.value})}><option value="">Select {type} account</option>{options.users.map(user=><option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label><label>School profile<select required disabled={loading || busy} value={values.profile_id} onChange={e=>setValues({...values,profile_id:e.target.value})}><option value="">Select {type} profile</option>{options.profiles.map(profile=><option key={profile.id} value={profile.id}>{profile.name}{profile.admission_no?` · ${profile.admission_no}`:` · ${profile.mobile}`}</option>)}</select></label></div>{error&&<div className="form-error">{error}</div>}{notice&&<div className="success-notice">{notice}</div>}<button disabled={loading || busy || !values.user_id || !values.profile_id} className="button button-small"><Link2 size={16}/>Link account</button></form><section className="data-panel"><div className="panel-title"><div><span>Access history</span><h2>Profile links</h2></div><b>{links.length} records</b></div><div className="table-wrap"><table><thead><tr><th>Account</th><th>Profile type</th><th>Profile ID</th><th>Status</th><th>Linked</th><th>Action</th></tr></thead><tbody>{links.map(link=><tr key={link.id}><td><b>{link.user_name}</b><small>{link.user_email}</small></td><td>{link.profile_type}</td><td>{link.profile_id}</td><td>{link.status}</td><td>{new Date(link.linked_at).toLocaleDateString()}</td><td>{link.status==='active'&&<button disabled={loading || busy} className="danger" onClick={()=>revoke(link.id)}><Trash2 size={15}/>Revoke</button>}</td></tr>)}</tbody></table></div></section></>
}
