import {useEffect,useState} from 'react'
import {api} from '../lib/api'

export default function ExamReadiness({examId,editable}) {
  const [data,setData]=useState(null),[ids,setIds]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{let live=true;api(`/exams/${examId}/readiness`).then(r=>{if(live){setData(r);setIds(r.subjects.map(s=>s.id))}}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[examId])
  async function load(save=false){setBusy(true);setError('');try{const r=await api(`/exams/${examId}/readiness`,save?{method:'PUT',body:JSON.stringify({subject_ids:ids})}:{});setData(r);setIds(r.subjects.map(s=>s.id))}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <section className="editor-card"><h3>Exam readiness</h3><p>Choose all expected subjects. Every active student needs a graded, absent or exempt result. Exempt subjects are excluded from totals; absent results count as zero.</p>
    {error&&<p role="alert">{error}</p>}
    <div className="field-grid">{data?.available_subjects.map(s=><label key={s.id}><input type="checkbox" disabled={!editable||busy} checked={ids.includes(s.id)} onChange={e=>setIds(old=>e.target.checked?[...old,s.id]:old.filter(id=>id!==s.id))}/>{s.name}</label>)}</div>
    {editable&&<button disabled={busy||!ids.length} onClick={()=>load(true)}>Save expected subjects</button>} <button disabled={busy} onClick={()=>load()}>Check completeness</button>
    {data&&<><p role="status">{data.ready?'Ready to publish':!data.subjects_configured?'Configure expected subjects':`${data.missing_count} missing results`} · {data.student_count} students · {data.expected_count} expected results</p><ul>{data.missing.map(m=><li key={`${m.student_id}:${m.subject_id}`}>{m.student_name} — {m.subject_name}</li>)}</ul>{data.missing_truncated&&<p>First 200 missing results shown. Complete these and refresh.</p>}</>}
  </section>
}
