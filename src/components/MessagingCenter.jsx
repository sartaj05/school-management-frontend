/* eslint-disable react-hooks/set-state-in-effect */
import { MessageCircle, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi } from '../lib/api'

const formatDate = value => value ? new Date(value).toLocaleString() : '—'

export default function MessagingCenter({ user }) {
  const [rows, setRows] = useState([]), [selected, setSelected] = useState(null), [thread, setThread] = useState(null)
  const [reply, setReply] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')

  async function load() {
    setError('')
    try { const result = await schoolApi.messageThreads(); setRows(result.data || []) }
    catch (err) { setError(err.message) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!selected) { setThread(null); return }
    schoolApi.messageThread(selected).then(result => { setThread(result.data); schoolApi.markMessageThreadRead(selected).catch(() => {}) }).catch(err => setError(err.message))
  }, [selected])

  async function sendReply(event) {
    event.preventDefault(); if (!reply.trim()) return
    setBusy(true); setError(''); setNotice('')
    try { const result = await schoolApi.sendMessage(selected, { body: reply }); setReply(''); setNotice(result.message); const refreshed = await schoolApi.messageThread(selected); setThread(refreshed.data); await load() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <><section className="people-hero"><div><span>School communication</span><h2>Parent–teacher messages</h2><p>Reply to parent and student questions in a private, trackable conversation.</p></div><MessageCircle/></section><section className="data-panel portal-messages staff-messages"><div className="panel-title"><div><span>Conversation inbox</span><h2>Messages</h2></div><b>{rows.length} conversations</b></div>{error && <div className="form-error">{error}</div>}{notice && <div className="success-notice">{notice}</div>}<div className="message-layout"><div className="message-thread-list">{!rows.length ? <div className="empty-state"><MessageCircle/><h3>No messages yet</h3><p>Parent and student conversations will appear here.</p></div> : rows.map(row => <button key={row.id} className={selected === row.id ? 'message-thread active' : 'message-thread'} onClick={() => setSelected(row.id)}><span><b>{row.subject}</b><small>{row.student_name}</small></span>{Number(row.unread_count) > 0 && <em>{row.unread_count}</em>}<small>{row.last_message || 'No messages yet'}</small></button>)}</div><div className="message-conversation">{!thread ? <div className="empty-state"><MessageCircle/><h3>Select a conversation</h3><p>Choose a thread to read and reply.</p></div> : <><div className="message-conversation-head"><div><span>{thread.thread.student_name}</span><h3>{thread.thread.subject}</h3></div><small>{thread.thread.status}</small></div><div className="message-bubbles">{thread.messages.map(item => <article key={item.id} className={item.sender_user_id === Number(user?.id) ? 'message-bubble own' : 'message-bubble'}><b>{item.sender_name || item.sender_role}</b><p>{item.body}</p><small>{formatDate(item.created_at)}</small></article>)}</div><form className="message-reply" onSubmit={sendReply}><textarea required rows="2" maxLength="2000" value={reply} onChange={event => setReply(event.target.value)} placeholder="Write a reply"/><button className="button button-small" disabled={busy}><Send size={14}/>{busy ? 'Sending…' : 'Send reply'}</button></form></>}</div></div></section></>
}
