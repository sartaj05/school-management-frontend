import {useEffect,useState} from 'react'
import {api} from '../lib/api'
import {confirmPopup} from '../lib/confirmPopup'
export default function AdmissionWaitlist(){
  const [data,setData]=useState({data:[],total:0}),[q,setQ]=useState(''),[klass,setClass]=useState(''),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0)
  const [selected,setSelected]=useState(null),[section,setSection]=useState('A'),[days,setDays]=useState(7),[note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[history,setHistory]=useState([])
  useEffect(()=>{let active=true;api(`/admissions/waitlist?${new URLSearchParams({q,class_name:klass,page})}`).then(r=>{if(active)setData(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[q,klass,page,refresh])
  async function choose(row){setSelected(row);setSection(row.section||'A');setNote('');setError('');setHistory([]);try{const r=await api(`/admissions/waitlist?application_id=${row.id}`);setHistory(r.history||[])}catch(e){setError(e.message)}}
  async function act(action){if(!await confirmPopup({title:`${action} seat?`,message:action==='accept'?'Record the family’s acceptance of this offer. Enrollment remains a separate action.':'This updates the waiting list and reserved seat capacity.',confirmLabel:'Confirm'}))return
    setBusy(true);setError('');try{await api(`/admissions/applications/${selected.id}/seat-offer`,{method:'POST',body:JSON.stringify({action,section,valid_days:Number(days),note,expected_version:selected.version})});setSelected(null);setRefresh(x=>x+1)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <section className="data-panel"><h2>Admission waitlist and seat offers</h2><p>Offers reserve school/class capacity until expiry. Record family acceptance, then enroll from Applications using the offered section.</p>
    <div className="field-grid"><label>Find application<input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/></label><label>Filter class<input value={klass} onChange={e=>{setClass(e.target.value);setPage(1)}}/></label></div>
    {error&&<p role="alert">{error}</p>}<div className="table-wrap"><table><thead><tr><th>Student</th><th>Class / section</th><th>Seat status</th><th>Expires</th><th>Action</th></tr></thead><tbody>{data.data.map(r=><tr key={r.id}><td>{r.name} · {r.application_no}</td><td>{r.applying_class} / {r.section||'—'}</td><td>{r.seat_status}</td><td>{r.expires_at?new Date(r.expires_at).toLocaleString():'—'}</td><td><button disabled={busy} onClick={()=>choose(r)}>Manage seat</button></td></tr>)}</tbody></table></div>
    <button disabled={page===1||busy} onClick={()=>setPage(page-1)}>Previous applications</button><button disabled={page*25>=data.total||busy} onClick={()=>setPage(page+1)}>Next applications</button>
    {selected&&<div className="editor-card"><h3>{selected.name} · {selected.seat_status}</h3><label>Offered section<input maxLength={20} value={section} disabled={selected.seat_status==='offered'} onChange={e=>setSection(e.target.value)}/></label><label>Valid days<input type="number" min={1} max={30} value={days} onChange={e=>setDays(e.target.value)}/></label><label>Confirmation / reason<textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label>
      <div className="student-row-actions">{['not_waitlisted','cancelled'].includes(selected.seat_status)&&<button disabled={busy||note.trim().length<3} onClick={()=>act('waitlist')}>Add to waitlist</button>}
      {['waitlisted','expired'].includes(selected.seat_status)&&<button disabled={busy||note.trim().length<3} onClick={()=>act('offer')}>Offer seat</button>}
      {selected.seat_status==='offered'&&<button disabled={busy||note.trim().length<3} onClick={()=>act('accept')}>Record family acceptance</button>}
      {!['not_waitlisted','cancelled'].includes(selected.seat_status)&&<button disabled={busy||note.trim().length<3} onClick={()=>act('cancel')}>Cancel reservation</button>}
      <button disabled={busy} onClick={()=>setSelected(null)}>Close seat details</button></div>
      <h4>Seat history</h4>{history.map((h,i)=><p key={i}>{h.event} · {h.created_at} · {h.details.note}</p>)}</div>}
  </section>
}
