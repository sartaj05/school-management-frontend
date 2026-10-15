import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function LeaveDelivery({ requestId }) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[refresh,setRefresh]=useState(0)
  useEffect(()=>{let active=true;api(`/leave/requests/${requestId}/notifications`).then(r=>{if(active){setData(r);setError('')}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[requestId,refresh])
  return <section><h3>Leave notification tracking</h3><button onClick={()=>setRefresh(n=>n+1)}>Refresh delivery</button>{error&&<p role="alert">{error}</p>}{data&&<><p>{data.message}</p>{data.missing_roles?.length>0&&<p>No delivery record for: {data.missing_roles.join(', ')}. Check linked active accounts and class assignments. Older notices may not have delivery records.</p>}{data.data?.map(r=><p key={r.id}><strong>{r.recipient || r.role} · {r.role}</strong><br/>{r.event} · {r.status}<br/>Delivered: {r.delivered_at?new Date(r.delivered_at).toLocaleString():'—'} · Read: {r.read_at?new Date(r.read_at).toLocaleString():'Not yet'}</p>)}</>}</section>
}
