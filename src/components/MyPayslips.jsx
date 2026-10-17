import { useEffect, useState } from 'react'
import { api, downloadApi } from '../lib/api'

export default function MyPayslips({ admin=false }) {
  const [slips,setSlips]=useState([]),[queries,setQueries]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const [selected,setSelected]=useState(''),[question,setQuestion]=useState(''),[answers,setAnswers]=useState({})
  async function load(){try{if(!admin)setSlips((await api('/payroll/mine')).data);setQueries((await api('/payroll/queries')).data)}catch(e){setError(e.message)}}
  useEffect(()=>{const timer=setTimeout(load,0);return()=>clearTimeout(timer)},[admin]) // eslint-disable-line react-hooks/exhaustive-deps
  async function send(path,body){setBusy(true);setError('');try{await api(path,{method:'POST',body:JSON.stringify(body)});setQuestion('');await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <section className="data-panel"><h2>{admin?'Employee salary questions':'My payslips'}</h2><button disabled={busy} onClick={load}>Refresh payslips and questions</button>{error&&<p role="alert">{error}</p>}
    {!admin&&<><p>Only published payslips linked to your staff account appear here.</p>{!slips.length&&<p>No published payslips yet.</p>}{slips.map(s=><article key={s.id} className="editor-card"><h3>{s.payroll_month.slice(0,7)} · {s.full_name}</h3><p>Basic ₹{s.basic_salary} · Allowances ₹{s.allowances} · Deductions ₹{s.deductions} · Attendance deduction ₹{s.attendance_deduction}</p><b>Net salary ₹{s.net_salary}</b><br/><button onClick={()=>downloadApi(`/payroll/mine/${s.id}/pdf`,`payslip-${s.id}.pdf`).catch(e=>setError(e.message))}>Download payslip PDF</button></article>)}<form onSubmit={e=>{e.preventDefault();send('/payroll/queries',{payslip_id:Number(selected),question})}}><label>Payslip<select aria-label="Payslip" required value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select month</option>{slips.map(s=><option key={s.id} value={s.id}>{s.payroll_month.slice(0,7)}</option>)}</select></label><label>Salary question<textarea required maxLength={2000} value={question} onChange={e=>setQuestion(e.target.value)}/></label><button disabled={busy||!selected}>Send to School Admin</button></form></>}
    {queries.map(q=><article className="editor-card" key={q.id}><h3>{q.full_name} · {q.payroll_month.slice(0,7)}</h3><p>{q.question}</p><p>{q.response?`Admin: ${q.response}`:'Awaiting Admin response'}</p>{admin&&!q.response&&<><label>Reply<textarea maxLength={2000} value={answers[q.id]||''} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})}/></label><button disabled={busy||!answers[q.id]?.trim()} onClick={()=>send(`/payroll/queries/${q.id}/answer`,{response:answers[q.id]})}>Send response</button></>}</article>)}
  </section>
}
