/* MediaRecorder timestamps are created in user-triggered callbacks. */
/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import { MonitorUp, Play, RefreshCw, Square, Trash2, Upload, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { blobApi, schoolApi } from '../lib/api'

const emptySession = { class_id: '', subject_id: '', teacher_id: '', title: '', description: '', scheduled_start: '', scheduled_end: '' }

export default function SmartClassroomManagement({ user }) {
  const admin = user.role === 'School Admin'
  const [options, setOptions] = useState({ classes: [], subjects: [], teachers: [] })
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState(emptySession)
  const [recordingSession, setRecordingSession] = useState(null)
  const [recordingBlob, setRecordingBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)

  async function load() {
    setBusy(true); setError('')
    try {
      const [optionResult, sessionResult] = await Promise.all([schoolApi.smartClassroomOptions(), schoolApi.smartClassroomSessions()])
      setOptions(optionResult.data || { classes: [], subjects: [], teachers: [] })
      setSessions(sessionResult.data || [])
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => () => { streamRef.current?.getTracks().forEach(track => track.stop()); if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))
  const classLabel = item => `${item.class_name}${item.section ? ` · ${item.section}` : ''}`

  async function createSession(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try { const result = await schoolApi.createSmartClassroomSession({ ...form, class_id: Number(form.class_id), subject_id: form.subject_id ? Number(form.subject_id) : null, teacher_id: form.teacher_id ? Number(form.teacher_id) : null }); setNotice(result.message); setForm(emptySession); await load() }
    catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function startRecording(session) {
    setError(''); setNotice('')
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('This browser does not support screen recording. Use a recent Chrome, Edge or Firefox browser.')
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      const preferred = ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'].find(type => window.MediaRecorder?.isTypeSupported?.(type))
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined)
      chunksRef.current = []; streamRef.current = stream; startedAtRef.current = Date.now(); recorderRef.current = recorder
      recorder.ondataavailable = event => event.data.size && chunksRef.current.push(event.data)
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' }); setRecordingBlob({ sessionId: session.id, blob, duration: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) }); setPreviewUrl(URL.createObjectURL(blob)); setRecordingSession(null); stream.getTracks().forEach(track => track.stop()) }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { if (recorder.state !== 'inactive') recorder.stop() })
      recorder.start(1000); setRecordingSession(session.id); await schoolApi.updateSmartClassroomSession(session.id, { status: 'recording' })
    } catch (err) { streamRef.current?.getTracks().forEach(track => track.stop()); setError(err.message) }
  }

  function stopRecording() { if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop() }

  async function uploadRecording() {
    if (!recordingBlob) return
    setSaving(true); setError(''); setNotice('')
    try { const body = new FormData(); body.append('recording', recordingBlob.blob, `smart-class-${recordingBlob.sessionId}.webm`); body.append('duration_seconds', String(recordingBlob.duration)); const result = await schoolApi.uploadSmartClassroomRecording(recordingBlob.sessionId, body); setNotice(result.message); setRecordingBlob(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(''); await load() }
    catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function previewRecording(id) {
    setError('')
    try { const blob = await blobApi(`/smart-classroom/recordings/${id}/stream`); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(URL.createObjectURL(blob)); setRecordingBlob(null) }
    catch (err) { setError(err.message) }
  }

  async function deleteRecording(id) {
    setSaving(true); setError(''); setNotice('')
    try { const result = await schoolApi.deleteSmartClassroomRecording(id); setNotice(result.message); await load() }
    catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return <div className="smart-classroom-management">
    <section className="people-hero smart-classroom-hero"><div><span>Enterprise classroom innovation</span><h2>Smart classroom recording</h2><p>Create a class session, record a lesson or screen demonstration, and keep the private recording in your school workspace.</p></div><Video /></section>
    {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="success-notice" role="status">{notice}</div>}
    {recordingSession && <div className="recording-status"><span className="recording-dot" />Recording in progress. Share your screen or class, then stop when the lesson is complete.<button className="button button-small" onClick={stopRecording}><Square size={14} />Stop recording</button></div>}
    {recordingBlob && <section className="data-panel recording-preview"><div className="panel-title"><div><span>Ready to save</span><h2>Review your classroom recording</h2></div><button className="button button-small" disabled={saving} onClick={uploadRecording}><Upload size={14} />Upload recording</button></div>{previewUrl && <video controls src={previewUrl} />}</section>}
    <form className="editor-card smart-classroom-form" onSubmit={createSession}><div className="editor-heading"><MonitorUp /><div><h3>Create a smart class session</h3><p>Recordings are private to Enterprise staff accounts and are stored outside the public uploads route.</p></div></div><div className="field-grid"><label>Class<select required value={form.class_id} onChange={event => field('class_id', event.target.value)}><option value="">Select class</option>{options.classes.map(item => <option key={item.id} value={item.id}>{classLabel(item)}</option>)}</select></label><label>Subject<select value={form.subject_id} onChange={event => field('subject_id', event.target.value)}><option value="">No subject selected</option>{options.subjects.map(item => <option key={item.id} value={item.id}>{item.name}{item.code ? ` · ${item.code}` : ''}</option>)}</select></label>{admin && <label>Teacher<select required value={form.teacher_id} onChange={event => field('teacher_id', event.target.value)}><option value="">Select teacher</option>{options.teachers.map(item => <option key={item.id} value={item.id}>{item.full_name}{item.department ? ` · ${item.department}` : ''}</option>)}</select></label>}<label>Session title<input required maxLength="180" value={form.title} onChange={event => field('title', event.target.value)} placeholder="e.g. Fractions with visual examples" /></label><label>Start<input type="datetime-local" value={form.scheduled_start} onChange={event => field('scheduled_start', event.target.value)} /></label><label>End<input type="datetime-local" value={form.scheduled_end} onChange={event => field('scheduled_end', event.target.value)} /></label><label className="wide">Description<textarea maxLength="2000" value={form.description} onChange={event => field('description', event.target.value)} placeholder="Add a short lesson note for staff." /></label></div><button className="button button-small" disabled={saving || busy}><Video size={15} />Create session</button></form>
    <section className="data-panel recording-list"><div className="panel-title"><div><span>Private lesson library</span><h2>Class sessions and recordings</h2></div><div className="panel-title-actions"><b>{sessions.length} sessions</b><button className="button button-small button-ghost" onClick={load} disabled={busy}><RefreshCw size={14} />Refresh</button></div></div>{busy ? <p>Loading classroom sessions…</p> : !sessions.length ? <div className="empty-state"><Video /><h3>No smart class sessions yet</h3><p>Create a session above to start your first Enterprise recording.</p></div> : <div className="recording-card-grid">{sessions.map(session => <article className="recording-card" key={session.id}><div className="recording-card-icon"><Video /></div><div className="recording-card-copy"><span>{classLabel(session)}{session.subject_name ? ` · ${session.subject_name}` : ''}</span><h3>{session.title}</h3><p>{session.description || 'No session description.'}</p><small>{session.teacher_name} · {session.scheduled_start ? new Date(session.scheduled_start).toLocaleString() : 'Unscheduled'}</small></div><span className={`recording-pill ${session.status}`}>{session.status}</span><div className="recording-controls">{session.recording_id ? <><button className="button button-small button-ghost" disabled={saving} onClick={() => previewRecording(session.recording_id)}><Play size={14} />Preview</button><button className="button button-small button-ghost" disabled={saving} onClick={() => deleteRecording(session.recording_id)}><Trash2 size={14} />Delete</button></> : <button className="button button-small" disabled={Boolean(recordingSession) || saving} onClick={() => startRecording(session)}><MonitorUp size={14} />Record lesson</button>}</div></article>)}</div>}</section>
  </div>
}
