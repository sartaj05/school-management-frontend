import { useEffect, useRef, useState } from 'react'

import { api, downloadApi, schoolApi } from '../lib/api'



export default function MessagingCenter({user,studentId}) {

  const [rows,setRows]=useState([]),[selected,setSelected]=useState(null),[thread,setThread]=useState(null)

  const [students,setStudents]=useState([]),[recipients,setRecipients]=useState([]),[chosenStudent,setStudent]=useState('')

  const [form,setForm]=useState({recipient_user_id:'',subject:'',body:''}),[reply,setReply]=useState(''),[attachment,setAttachment]=useState(null)

  const [busy,setBusy]=useState(false),[error,setError]=useState('')

  const student=studentId||chosenStudent

  const attempt=useRef(null)

  const load=async()=>{setRows((await schoolApi.messageThreads()).data||[])}

  useEffect(()=>{let live=true;schoolApi.messageThreads().then(r=>{if(live)setRows(r.data||[])}).catch(e=>{if(live)setError(e.message)});if(!studentId)(['Parent','Student'].includes(user?.role)?schoolApi.portalMe():schoolApi.students()).then(r=>{if(live)setStudents(r.student?[r.student]:r.children||r.data||r.students||[])}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[studentId,user?.role])

  useEffect(()=>{let live=true;if(student)schoolApi.messageRecipients(student).then(r=>{if(live)setRecipients(r.data||[])}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[student])

  useEffect(()=>{

    if(!selected)return

    let live=true,running=false

    async function refresh(){if(running||document.hidden)return;running=true;try{const r=await schoolApi.messageThread(selected);if(live){setThread(r.data);await schoolApi.markMessageThreadRead(selected);await load()}}catch(e){if(live)setError(e.message)}finally{running=false}}

    refresh();const timer=setInterval(refresh,15000);return()=>{live=false;clearInterval(timer)}

  },[selected])

  async function upload(file){if(!file)return;setBusy(true);setError('');try{const data=new FormData();data.append('file',file);data.append('category','message');const r=await api('/documents/files',{method:'POST',body:data});setAttachment(r.file)}catch(e){setError(e.message)}finally{setBusy(false)}}

  async function send(e){e.preventDefault();if(busy)return;setBusy(true);setError('')

    const path=selected?`/messages/threads/${selected}/messages`:'/messages/threads'

    const payload=selected?{body:reply}:{...form,student_id:Number(student),recipient_user_id:Number(form.recipient_user_id)}

    if(attachment)payload.attachment_file_id=attachment.id

    const key=path+JSON.stringify(payload)

    if(attempt.current?.key!==key)attempt.current={key,id:crypto.randomUUID()}

    try{const result=await api(path,{method:'POST',headers:{'X-Client-Operation-Id':attempt.current.id},body:JSON.stringify({...payload,client_operation_id:attempt.current.id})});attempt.current=null;setReply('');setAttachment(null);setForm({...form,body:''});const id=selected||result.thread_id;setSelected(id);setThread((await schoolApi.messageThread(id)).data);await load()}catch(e){setError(`${e.message} Your message is retained; retry without changing it to avoid duplicates.`)}finally{setBusy(false)}

  }

  return <section className="data-panel portal-messages"><div className="panel-title"><h2>School messages</h2><button disabled={busy} onClick={()=>{setSelected(null);setThread(null);setAttachment(null);setReply('');attempt.current=null}}>New conversation</button></div>{error&&<p role="alert">{error}</p>}

    <div className="message-layout"><div className="message-thread-list">{rows.map(r=><button disabled={busy} key={r.id} onClick={()=>{setSelected(r.id);setThread(null);setReply('');setAttachment(null);attempt.current=null}}><b>{r.subject}</b><small>{r.student_name} · {r.unread_count||0} unread</small></button>)}{!rows.length&&<p>No conversations yet.</p>}</div>

    <div className="message-conversation">{selected&&thread&&<><h3>{thread.thread.subject}</h3><div className="message-bubbles">{thread.messages.map(m=><article key={m.id} className={m.sender_user_id===Number(user?.id)?'message-bubble own':'message-bubble'}><b>{m.sender_name}</b><p>{m.body}</p>{m.attachment_file_id&&<button onClick={()=>downloadApi(`/documents/files/${m.attachment_file_id}`,m.attachment_filename).catch(e=>setError(e.message))}>Download {m.attachment_filename}</button>}<small>{new Date(m.created_at).toLocaleString()}{m.sender_user_id===Number(user?.id)?` · ${m.read_by_recipient?'Read':'Sent'}`:''}</small></article>)}</div></>}

    <form onSubmit={send}>{!selected&&<><label>Student{studentId?<span>Selected child</span>:<select required value={student} onChange={e=>{setStudent(e.target.value);setRecipients([]);setForm({...form,recipient_user_id:''})}}><option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.first_name||s.name} {s.last_name||''} · {s.class_name} {s.section}</option>)}</select>}</label><label>Recipient<select required value={form.recipient_user_id} onChange={e=>setForm({...form,recipient_user_id:e.target.value})}><option value="">Select recipient</option>{recipients.map(r=><option key={r.id} value={r.id}>{r.name} · {r.role}</option>)}</select></label><label>Subject<input required maxLength={180} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/></label></>}

      <label>{selected?'Reply':'Message'}<textarea required maxLength={2000} rows={4} value={selected?reply:form.body} onChange={e=>selected?setReply(e.target.value):setForm({...form,body:e.target.value})}/></label>

      <label>Attach photo or PDF (up to 5 MB)<input disabled={busy} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>upload(e.target.files[0])}/></label>{attachment&&<p>{attachment.original_filename} <button type="button" disabled={busy} onClick={()=>setAttachment(null)}>Remove attachment</button></p>}<button disabled={busy||(!selected&&!student)}>{busy?'Sending…':selected?'Send reply':'Start conversation'}</button>

    </form></div></div></section>

}
