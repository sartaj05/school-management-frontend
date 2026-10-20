import {useEffect,useState} from 'react'
import {api,downloadApi} from '../lib/api'

export default function StudentProgress({studentId}) {
  const [query,setQuery]=useState(''),[search,setSearch]=useState(''),[page,setPage]=useState(1),[options,setOptions]=useState({data:[],years:[],total:0})
  const [selected,setSelected]=useState(studentId?String(studentId):''),[year,setYear]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{let active=true;api(`/exams/progress/students?${new URLSearchParams({q:search,page})}`).then(r=>{if(active)setOptions(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[search,page])
  useEffect(()=>{if(!selected)return;let active=true;const timer=setTimeout(()=>{setBusy(true);setError('');setData(null);api(`/exams/progress?${new URLSearchParams({student_id:selected,academic_year:year})}`).then(r=>{if(active)setData(r)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)})},0);return()=>{active=false;clearTimeout(timer)}},[selected,year])
  return <section className="data-panel"><h2>Student progress across terms</h2><p>Published results, recorded attendance, homework and shared support updates. Exam percentages exclude exempt subjects.</p>
    {!studentId&&<><form onSubmit={e=>{e.preventDefault();setSearch(query);setPage(1)}}><label>Find student<input value={query} onChange={e=>setQuery(e.target.value)} maxLength={100}/></label><button>Search students</button></form><div className="field-grid">{options.data.map(s=><button key={s.id} aria-pressed={String(s.id)===selected} onClick={()=>setSelected(String(s.id))}>{s.name} · {s.class_name} {s.section}</button>)}</div><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous students</button><span> Page {page} · {options.total} students </span><button disabled={page*25>=options.total} onClick={()=>setPage(page+1)}>Next students</button></>}
    <label>Academic year<select value={year} onChange={e=>setYear(e.target.value)}><option value="">All years</option>{options.years.map(y=><option key={y.year_label}>{y.year_label}</option>)}</select></label>
    {error&&<p role="alert">{error}</p>}{busy&&<p role="status">Loading progress…</p>}{!selected&&<p>Select a student to view progress.</p>}
    {data&&<><h3>{data.student.name} · {data.student.class_name} {data.student.section}</h3><p>{data.academic_year} · {data.summary.published_exams} published exams · Attendance {data.summary.attendance_percentage==null?'N/A':`${data.summary.attendance_percentage}%`} · Homework {data.summary.submitted} / {data.summary.assignments} submitted</p>
      <button disabled={busy} onClick={()=>downloadApi(`/exams/progress.pdf?${new URLSearchParams({student_id:selected,academic_year:year})}`,`student-progress-${selected}.pdf`).catch(e=>setError(e.message))}>Download progress PDF</button>
      <h3>Exam trends</h3><div className="table-wrap"><table><thead><tr><th>Exam</th><th>Year / class</th><th>Percentage</th></tr></thead><tbody>{data.exams.map(exam=><tr key={exam.id}><td>{exam.name} · {exam.term}</td><td>{exam.academic_year} · {exam.class_name}</td><td>{exam.percentage==null?'Pending / N/A':`${exam.percentage}%`}{exam.percentage!=null&&<progress aria-label={`${exam.name} percentage`} max="100" value={exam.percentage} style={{display:'block',maxWidth:'100%'}}/>}</td></tr>)}</tbody></table></div>
      <h3>Progress timeline</h3>{!data.timeline.length&&<p>No records in this period.</p>}{data.timeline.map((event,i)=><article className="editor-card" key={i}><small>{event.date} · {event.type}</small><p style={{overflowWrap:'anywhere'}}>{event.description}</p></article>)}
    </>}
  </section>
}
