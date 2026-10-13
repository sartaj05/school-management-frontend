import { useEffect, useState } from 'react'
import { api, downloadApi } from '../lib/api'

export default function PaymentStatus({ invoice, refreshKey }) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[refresh,setRefresh]=useState(0)
  useEffect(()=>{let active=true;api(`/fees/invoices/${invoice}/payment-status`).then(r=>{if(active){setData(r);setError('')}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[invoice,refreshKey,refresh])
  return <section className="editor-card" style={{marginTop:24}}><h2>Payment tracking</h2><button type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh status</button>{error&&<p role="alert">{error}</p>}{data&&<><p>Invoice balance: ₹{data.balance}</p>{(data.data || []).map(r=><article key={r.id} style={{borderTop:'1px solid #ddd',padding:'16px 0'}}><strong>₹{r.amount} · {r.status.replaceAll('_',' ')}</strong><p>{r.payment_method} · {r.reference_number||'Cash'} · Submission #{r.id}</p><ol>{r.timeline.map(t=><li key={t.status}>{t.status.replaceAll('_',' ')} — {new Date(t.at).toLocaleString()}</li>)}</ol>{r.review_notes&&<p>School note: {r.review_notes}</p>}{r.proof_file_id&&r.can_view_proof&&<button onClick={()=>downloadApi(`/documents/files/${r.proof_file_id}`,`payment-proof-${r.id}`).catch(e=>setError(e.message))}>Download proof</button>}</article>)}{(data.recorded_payments || []).map(r=><p key={`paid-${r.id}`}>Recorded: ₹{r.amount} · {r.payment_method} · {r.payment_date}</p>)}{!data.data?.length&&!data.recorded_payments?.length&&<p>No payments submitted yet.</p>}</>}</section>
}
