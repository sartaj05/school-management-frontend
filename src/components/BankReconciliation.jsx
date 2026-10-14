import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function BankReconciliation({ user }) {
  const [rows,setRows]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
  async function run(options) { setBusy(true); try { const r=await api('/fees/bank-statement',options);setRows(r.data||[]);if(options)setMessage(r.message) } catch(e){setMessage(e.message)} finally{setBusy(false)} }
  useEffect(()=>{const timer=setTimeout(()=>run(),0);return()=>clearTimeout(timer)},[])
  async function upload(e) {const file=e.target.files?.[0];if(!file)return;const data=new FormData();data.append('file',file);await run({method:'POST',body:data});e.target.value=''}
  async function confirm(row) {
    if(!await confirmPopup({title:'Confirm bank match?',message:`Match ${row.reference}, INR ${row.amount} to payment #${row.candidates[0].id}? No new payment will be created.`,confirmLabel:'Confirm match',tone:'primary'}))return
    setBusy(true);try {const r=await api(`/fees/bank-statement/${row.id}/confirm`,{method:'POST',body:JSON.stringify({payment_id:row.candidates[0].id})});setMessage(r.message);await run()}catch(e){setMessage(e.message)}finally{setBusy(false)}
  }
  return <section className="data-panel"><h2>Bank reconciliation</h2><p>Import credit transactions as UTF-8 CSV: <code>reference,amount,date</code> (YYYY-MM-DD). Matching requires the same UTR, amount and date as a recorded payment. Duplicate references need review.</p><label>Upload bank credits <input type="file" accept=".csv,text/csv" disabled={busy} onChange={upload}/></label><button disabled={busy} onClick={()=>run()}>Refresh matches</button>{message&&<p role="status">{message}</p>}<div className="table-wrap"><table><thead><tr><th>UTR / reference</th><th>Date</th><th>Amount</th><th>Status</th><th>Payment / action</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.reference}</td><td>{r.date}</td><td>{r.amount}</td><td>{r.status.replaceAll('_',' ')}</td><td>{r.payment_id?`Payment #${r.payment_id}`:r.candidates.map(c=><span key={c.id}>{c.student_name} · #{c.id} </span>)}{user?.role==='School Admin'&&r.status==='suggested'&&<button disabled={busy} onClick={()=>confirm(r)}>Confirm match</button>}</td></tr>)}</tbody></table></div>{!rows.length&&<p>No bank credits imported.</p>}</section>
}
