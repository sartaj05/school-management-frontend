import {useCallback,useEffect,useState} from 'react'
import {api,downloadApi} from '../lib/api'
import {confirmPopup} from '../lib/confirmPopup'

export default function ApprovalInbox({initialKind='all', recordId}) {
  const [data,setData]=useState({data:[],counts:{},total:0}),[kind,setKind]=useState(initialKind),[page,setPage]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notes,setNotes]=useState({})
  const load=useCallback(async()=>{setBusy(true);setError('');try{setData(await api(`/dashboard/approvals?kind=${kind}&page=${page}`))}catch(e){setError(e.message)}finally{setBusy(false)}},[kind,page])
  useEffect(()=>{const timer=setTimeout(load,0);return()=>clearTimeout(timer)},[load])
  async function review(row,status) {
    const note=notes[`${row.kind}:${row.id}`]||''
    if(!note.trim()){setError('Enter review notes before making a decision.');return}
    if(!await confirmPopup({title:`${row.kind==='salary_query'?'Reply to':status==='approved'?'Approve':'Reject'} this request?`,message:`${row.person}: ${row.detail||row.method}. ${row.amount!=null?`Amount INR ${row.amount}. Verify the payment evidence first.`:''}`,confirmLabel:'Confirm decision',tone:'primary'}))return
    setBusy(true);setError('')
    const path=row.kind==='salary_query'?`/payroll/queries/${row.id}/answer`:row.kind==='attendance_correction'?`/attendance/corrections/${row.id}/review`:row.kind==='payment'?`/fees/collection-requests/${row.id}/review`:row.kind==='adjustment'?`/fees/adjustments/${row.id}/review`:`/leave/requests/${row.id}/status`
    try {await api(path,{method:['adjustment','attendance_correction','salary_query'].includes(row.kind)?'POST':'PATCH',body:JSON.stringify({status,notes:note,review_notes:note,response:note})});await load()}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <section className="data-panel"><div className="panel-title"><h2>Approval inbox · {Object.values(data.counts).reduce((a,b)=>a+b,0)} pending</h2><button disabled={busy} onClick={load}>Refresh inbox</button></div>
    <p>Review payments, adjustments, employee leave and attendance corrections. Reply to salary questions. Student leave is information only.</p>
    <label>Request type <select value={kind} onChange={e=>{setKind(e.target.value);setPage(1)}}>{[['all','All'],['payment','Fee verification'],['adjustment','Payment adjustments'],['employee_leave','Employee leave'],['attendance_correction','Attendance corrections'],['salary_query','Salary questions']].map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {data.data.filter(row=>!recordId || Number(row.id)===Number(recordId)).map(row=><article className="editor-card" key={`${row.kind}:${row.id}`}><h3>{row.person} · {row.kind.replaceAll('_',' ')}</h3><p>{row.detail}</p><p>{row.status} · {row.method} {row.amount!=null?`· INR ${row.amount}`:''} {row.reference?`· ${row.reference}`:''}</p>
      {row.file_id&&<button onClick={()=>downloadApi(`/documents/files/${row.file_id}`,`evidence-${row.id}`).catch(e=>setError(e.message))}>Download evidence</button>}
      <label>Review notes for {row.kind} #{row.id}<textarea maxLength={2000} value={notes[`${row.kind}:${row.id}`]||''} onChange={e=>setNotes({...notes,[`${row.kind}:${row.id}`]:e.target.value})}/></label>
      <div className="student-row-actions"><button disabled={busy} onClick={()=>review(row,'approved')}>{row.kind==='salary_query'?'Send reply':'Approve'}</button>{row.kind!=='salary_query'&&<button disabled={busy} onClick={()=>review(row,'rejected')}>Reject</button>}</div></article>)}
    {!busy&&!data.data.length&&<p>No pending requests in this view.</p>}
    <div className="student-row-actions"><button disabled={busy||page<=1} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page}</span><button disabled={busy||page*30>=data.total} onClick={()=>setPage(page+1)}>Next</button></div>
  </section>
}
