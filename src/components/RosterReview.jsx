import {useEffect,useState} from 'react'
import {api} from '../lib/api'
import {confirmPopup} from '../lib/confirmPopup'

export default function RosterReview({assignmentId}) {
  const [data,setData]=useState(null),[q,setQ]=useState(''),[page,setPage]=useState(1)
  const [add,setAdd]=useState([]),[remove,setRemove]=useState([]),[evidence,setEvidence]=useState(''),[preview,setPreview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const path=`/assignments/${assignmentId}/roster-review`
  useEffect(()=>{let active=true;api(`${path}?${new URLSearchParams({q,page})}`).then(r=>{if(active)setData(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[path,q,page])
  function toggle(id,items,set){set(items.includes(id)?items.filter(i=>i!==id):[...items,id]);setPreview(null)}
  async function submit(apply=false){setBusy(true);setError('');try{
    const body={expected_revision:data.revision,add_ids:add,remove_ids:remove,evidence}
    if(apply&&!await confirmPopup({title:'Apply historical roster review?',message:'Only the reviewed membership changes will be applied. Saved submissions cannot be removed.',confirmLabel:'Apply review'}))return
    const result=await api(`${path}/${apply?'apply':'preview'}`,{method:'POST',body:JSON.stringify(body)})
    if(apply){setData(await api(path));setAdd([]);setRemove([]);setPreview(null);setEvidence('')}else setPreview(result.preview)
  }catch(e){setError(e.message);setPreview(null)}finally{setBusy(false)}}
  if(!data)return <p role="status">{error||'Loading roster review…'}</p>
  return <section className="editor-card"><h3>Historical roster review · {data.title}</h3>
    <p>Use original enrollment evidence to correct recovered membership. Publication rosters and saved submissions are protected.</p>
    {!data.editable&&<p>This original publication roster is read-only.</p>}
    {error&&<p role="alert">{error}</p>}
    <h4>Current members</h4>{data.members.map(m=><label key={m.student_id}><input type="checkbox" disabled={busy||!data.editable||m.has_submission} checked={remove.includes(m.student_id)} onChange={()=>toggle(m.student_id,remove,setRemove)}/> Remove {m.student_snapshot.name} · {m.has_submission?'Saved submission — protected':m.provenance}</label>)}
    {data.editable&&<><label>Find historical student<input disabled={busy} value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/></label>
      {data.candidates.filter(s=>!data.members.some(m=>m.student_id===s.id)).map(s=><label key={s.id}><input type="checkbox" disabled={busy} checked={add.includes(s.id)} onChange={()=>toggle(s.id,add,setAdd)}/> Add {s.name} · {s.admission_no} · {s.class_name} {s.section}</label>)}
      <button disabled={busy||page===1} onClick={()=>setPage(page-1)}>Previous students</button><button disabled={busy||page*25>=data.total} onClick={()=>setPage(page+1)}>Next students</button>
      <p>{add.length} additions · {remove.length} removals</p><label>Historical evidence<textarea disabled={busy} minLength={10} maxLength={2000} value={evidence} onChange={e=>{setEvidence(e.target.value);setPreview(null)}}/></label>
      <button disabled={busy||evidence.trim().length<10||!(add.length+remove.length)} onClick={()=>submit()}>Preview roster changes</button>
      {preview&&<div><h4>Review changes</h4><p>Add: {preview.add.map(s=>s.name).join(', ')||'None'}</p><p>Remove: {preview.remove.map(s=>s.name).join(', ')||'None'}</p><p>{preview.evidence}</p><button disabled={busy} onClick={()=>submit(true)}>Apply reviewed changes</button></div>}</>}
    <h4>Review history</h4>{data.history.map(h=><p key={h.revision}>Revision {h.revision} · {h.reviewed_at} · {h.evidence}</p>)}
  </section>
}
