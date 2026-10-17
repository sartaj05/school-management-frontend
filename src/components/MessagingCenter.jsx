import { useCallback, useEffect, useRef, useState } from 'react'

import { api, downloadApi, schoolApi } from '../lib/api'



export default function MessagingCenter({user,studentId,initialThreadId}) {

  const [rows,setRows]=useState([]),[selected,setSelected]=useState(initialThreadId || null),[thread,setThread]=useState(null)

  const [students,setStudents]=useState([]),[recipients,setRecipients]=useState([]),[chosenStudent,setStudent]=useState('')

  const [form,setForm]=useState({recipient_user_id:'',subject:'',body:''}),[reply,setReply]=useState(''),[attachment,setAttachment]=useState(null)

  const [busy,setBusy]=useState(false),[error,setError]=useState('')

  const [studentSearch,setStudentSearch]=useState(''),[studentPage,setStudentPage]=useState(1),[moreStudents,setMoreStudents]=useState(false)
  const [search,setSearch]=useState(''),[page,setPage]=useState(1),[moreThreads,setMoreThreads]=useState(false)
  const threadRef=useRef(null),cursor=useRef(0),refreshRef=useRef(null)
  const student=studentId||chosenStudent

  const attempt=useRef(null)

  const load=useCallback(async()=>{const r=await api(`/messages/threads?${new URLSearchParams({page,q:search})}`);setRows(r.data||[]);setMoreThreads(!!r.has_more)},[page,search])
  useEffect(()=>{let live=true;const timer=setTimeout(()=>api(`/messages/threads?${new URLSearchParams({page,q:search})}`).then(r=>{if(live){setRows(r.data||[]);setMoreThreads(!!r.has_more)}}).catch(e=>{if(live)setError(e.message)}),250);return()=>{live=false;clearTimeout(timer)}},[page,search])
  useEffect(()=>{if(studentId)return;let live=true;const timer=setTimeout(()=>api(`/messages/students?${new URLSearchParams({page:studentPage,q:studentSearch})}`).then(r=>{if(live){setStudents(r.data||[]);setMoreStudents(!!r.has_more)}}).catch(e=>{if(live)setError(e.message)}),250);return()=>{live=false;clearTimeout(timer)}},[studentId,studentPage,studentSearch])
  useEffect(()=>{let live=true;if(student)schoolApi.messageRecipients(student).then(r=>{if(live)setRecipients(r.data||[])}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[student])
  useEffect(()=>{
    if(!selected)return
    let live=true,running=false
    cursor.current=0;threadRef.current=null
    async function refresh(){
      if(running||document.hidden)return
      running=true
      try{
        const r=await api(`/messages/threads/${selected}${cursor.current?'?after_id='+cursor.current:''}`)
        if(live){
          const previous=threadRef.current
          const messages=[...new Map([...(previous?.messages||[]),...r.data.messages].map(m=>[m.id,m])).values()].sort((a,b)=>a.id-b.id)
          for(const m of messages) if(m.is_own || m.sender_user_id===Number(user?.id)) m.read_by_recipient=m.read_by_recipient || (r.data.read_receipts||[]).some(p=>p.user_id!==m.sender_user_id && p.last_read_at && new Date(p.last_read_at)>=new Date(m.created_at))
          const next={...r.data,messages,has_more:previous?.has_more ?? r.data.has_more}
          threadRef.current=next;cursor.current=messages.at(-1)?.id||0;setThread(next)
          if(cursor.current) await api(`/messages/threads/${selected}/read`,{method:'PATCH',body:JSON.stringify({through_id:cursor.current})})
          await load()
        }
      }catch(e){if(live)setError(e.message)}finally{running=false}
    }
    refreshRef.current=refresh;refresh();const timer=setInterval(refresh,15000)
    return()=>{live=false;clearInterval(timer);refreshRef.current=null}
  },[selected,load,user?.id])
  async function older(){setBusy(true);try{const r=await api(`/messages/threads/${selected}?before_id=${thread.messages[0].id}`);const next={...thread,...r.data,messages:[...new Map([...r.data.messages,...thread.messages].map(m=>[m.id,m])).values()].sort((a,b)=>a.id-b.id)};threadRef.current=next;setThread(next)}catch(e){setError(e.message)}finally{setBusy(false)}}

  async function upload(file){if(!file)return;setBusy(true);setError('');try{const data=new FormData();data.append('file',file);data.append('category','message');const r=await api('/documents/files',{method:'POST',body:data});setAttachment(r.file)}catch(e){setError(e.message)}finally{setBusy(false)}}

  async function send(e){e.preventDefault();if(busy)return;setBusy(true);setError('')

    const path=selected?`/messages/threads/${selected}/messages`:'/messages/threads'

    const payload=selected?{body:reply}:{...form,student_id:Number(student),recipient_user_id:Number(form.recipient_user_id)}

    if(attachment)payload.attachment_file_id=attachment.id

    const key=path+JSON.stringify(payload)

    if(attempt.current?.key!==key)attempt.current={key,id:crypto.randomUUID()}

    try{const result=await api(path,{method:'POST',headers:{'X-Client-Operation-Id':attempt.current.id},body:JSON.stringify({...payload,client_operation_id:attempt.current.id})});attempt.current=null;setReply('');setAttachment(null);setForm({...form,body:''});const id=selected||result.thread_id;setSelected(id);if(selected)await refreshRef.current?.();await load()}catch(e){setError(`${e.message} Your message is retained; retry without changing it to avoid duplicates.`)}finally{setBusy(false)}

  }

  return <section className="data-panel portal-messages"><div className="panel-title"><h2>School messages</h2><button disabled={busy} onClick={()=>{setSelected(null);setThread(null);setAttachment(null);setReply('');attempt.current=null}}>New conversation</button></div>{error&&<p role="alert">{error}</p>}

    <div className="message-layout"><div className="message-thread-list"><label>Search conversations<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label><div><button disabled={busy||page===1} onClick={()=>setPage(page-1)}>Previous conversations</button><span>Page {page}</span><button disabled={busy||!moreThreads} onClick={()=>setPage(page+1)}>Next conversations</button></div>{rows.map(r=><button disabled={busy} key={r.id} onClick={()=>{setSelected(r.id);setThread(null);setReply('');setAttachment(null);attempt.current=null}}><b>{r.subject}</b><small>{r.student_name} · {r.unread_count||0} unread</small></button>)}{!rows.length&&<p>No conversations yet.</p>}</div>

    <div className="message-conversation">{selected&&thread&&<><h3>{thread.thread.subject}</h3>{thread.has_more&&<button disabled={busy} onClick={older}>Load earlier messages</button>}<div className="message-bubbles">{thread.messages.map(m=><article key={m.id} className={m.sender_user_id===Number(user?.id)?'message-bubble own':'message-bubble'}><b>{m.sender_name}</b><p>{m.body}</p>{m.attachment_file_id&&<button onClick={()=>downloadApi(`/documents/files/${m.attachment_file_id}`,m.attachment_filename).catch(e=>setError(e.message))}>Download {m.attachment_filename}</button>}<small>{new Date(m.created_at).toLocaleString()}{m.sender_user_id===Number(user?.id)?` · ${m.read_by_recipient?'Read':'Sent'}`:''}</small></article>)}</div></>}

    <form onSubmit={send}>{!selected&&<>{!studentId&&<><label>Search students<input value={studentSearch} onChange={e=>{setStudentSearch(e.target.value);setStudentPage(1);setStudent('');setRecipients([])}} placeholder="Name, admission number or class"/></label><button type="button" disabled={studentPage===1} onClick={()=>{setStudentPage(studentPage-1);setStudent('')}}>Previous students</button><button type="button" disabled={!moreStudents} onClick={()=>{setStudentPage(studentPage+1);setStudent('')}}>Next students</button></>}<label>Student{studentId?<span>Selected child</span>:<select required value={student} onChange={e=>{setStudent(e.target.value);setRecipients([]);setForm({...form,recipient_user_id:''})}}><option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.first_name||s.name} {s.last_name||''} · {s.class_name} {s.section}</option>)}</select>}</label><label>Recipient<select required value={form.recipient_user_id} onChange={e=>setForm({...form,recipient_user_id:e.target.value})}><option value="">Select recipient</option>{recipients.map(r=><option key={r.id} value={r.id}>{r.name} · {r.role}</option>)}</select></label><label>Subject<input required maxLength={180} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label></>}

      <label>{selected?'Reply':'Message'}<textarea required maxLength={2000} rows={4} value={selected?reply:form.body} onChange={e=>selected?setReply(e.target.value):setForm({...form,body:e.target.value})}/></label>

      <label>Attach photo or PDF (up to 5 MB)<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>upload(e.target.files[0])}/></label>{attachment&&<p>{attachment.original_filename} <button type="button" disabled={busy} onClick={()=>setAttachment(null)}>Remove attachment</button></p>}<button disabled={busy||(!selected&&!student)}>{busy?'Sending…':selected?'Send reply':'Start conversation'}</button>

    </form></div></div></section>

}
