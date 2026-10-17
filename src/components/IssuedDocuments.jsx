import { useEffect, useState } from 'react'
import { api, downloadApi } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function IssuedDocuments({ admin = false, studentId }) {
  const [rows, setRows] = useState([]), [options, setOptions] = useState({ students: [], exams: [] }), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const [form, setForm] = useState({ document_type: 'certificate', student_id: '', exam_id: '', title: '', body: '', replaces: '', reason: '', template_id: '' })
  async function load() {
    try { const r = await api(`/documents/issued${studentId ? `?student_id=${studentId}` : ''}`); setRows(r.data); if (admin) setOptions(await api('/documents/issued/options')) } catch (e) { setMessage(e.message) }
  }
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer) }, [admin, studentId]) // eslint-disable-line react-hooks/exhaustive-deps
  async function issue(e) {
    e.preventDefault(); setBusy(true)
    try { await api('/documents/issued', { method: 'POST', body: JSON.stringify({ ...form, template_id: form.template_id ? Number(form.template_id) : null, student_id: Number(form.student_id), exam_id: Number(form.exam_id) }) }); setForm(f => ({ ...f, replaces: '', reason: '' })); setMessage('Document issued. Download its PDF to share the QR verification link.'); await load() } catch (err) { setMessage(err.message) } finally { setBusy(false) }
  }
  async function preview() {
    setBusy(true)
    try {
      const r = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/documents/issued/preview`, {method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${sessionStorage.getItem('school_access_token')}`},body:JSON.stringify({...form,student_id:Number(form.student_id),exam_id:Number(form.exam_id),template_id:form.template_id ? Number(form.template_id) : null})})
      if (!r.ok) throw new Error((await r.json()).message || 'Preview failed')
      const url=URL.createObjectURL(await r.blob()); setPreviewUrl(old=>{if(old) URL.revokeObjectURL(old); return url})
    } catch(e) {setMessage(e.message)} finally {setBusy(false)}
  }
  const [previewUrl,setPreviewUrl]=useState('')
  useEffect(()=>()=>{if(previewUrl) URL.revokeObjectURL(previewUrl)},[previewUrl])
  async function revoke(row) {
    if (!form.reason.trim()) { setMessage('Enter a reason in the issuance form before revoking.'); return }
    if (!await confirmPopup({ title: 'Revoke this document?', message: `${row.title}: its QR link will show revoked.`, confirmLabel: 'Revoke', tone: 'danger' })) return
    setBusy(true); try { await api(`/documents/issued/${row.token}/revoke`, { method: 'POST', body: JSON.stringify({ reason: form.reason }) }); await load() } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const student = options.students.find(s => String(s.id) === String(form.student_id))
  return <section className="data-panel"><h2>Verified school documents</h2><p>Issued PDFs keep their original content. Scan the QR to check current validity. Public verification shows masked student details.</p>{message && <p role="status">{message}</p>}
    {admin && <form onSubmit={issue}><div className="field-grid">
      <label>Student<select required value={form.student_id} onChange={e => { field('student_id', e.target.value); field('exam_id', '') }}><option value="">Select student</option>{options.students.map(s => <option key={s.id} value={s.id}>{s.name} · {s.class_name} {s.section}</option>)}</select></label>
      <label>Document type<select value={form.document_type} onChange={e => {field('document_type', e.target.value); field('template_id','')}}><option value="certificate">Certificate</option><option value="report_card">Report card</option></select></label>
      {form.document_type === 'report_card' ? <label>Published exam<select required value={form.exam_id} onChange={e => field('exam_id', e.target.value)}><option value="">Select exam</option>{options.exams.filter(x => x.class_name === student?.class_name && (x.section || '') === (student?.section || '')).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label> : <><label>Certificate title<input required maxLength="120" value={form.title} onChange={e => field('title', e.target.value)} /></label><label>Certificate text<textarea required maxLength="4000" value={form.body} onChange={e => field('body', e.target.value)} /></label></>}
      <label>Document template<select value={form.template_id} onChange={e=>field('template_id',e.target.value)}><option value="">Standard school layout</option>{(options.templates || []).filter(t=>t.document_type===form.document_type).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Reason for revocation / replacement<input required={Boolean(form.replaces)} maxLength="2000" value={form.reason} onChange={e => field('reason', e.target.value)} /></label>
    </div>{form.replaces && <p>Replacing document {form.replaces}. Review the student, type and new contents before issuing. <button type="button" onClick={() => field('replaces', '')}>Cancel replacement</button></p>}<button type="button" disabled={busy} onClick={preview}>Preview PDF</button> <button className="button" disabled={busy}>Issue {form.replaces ? 'replacement' : 'document'}</button></form>}
    {previewUrl && <section aria-label="Document preview"><button onClick={()=>setPreviewUrl('')}>Close preview</button><iframe title="PDF preview" src={previewUrl} style={{width:'100%',height:'65vh',border:0}} /></section>}
    <button disabled={busy} onClick={load}>Refresh issued documents</button><div className="table-wrap"><table><thead><tr><th>Document / student</th><th>Issued</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(r => <tr key={r.token}><td>{r.title}<small>{r.student_name}</small></td><td>{new Date(r.issued_at).toLocaleDateString()}</td><td>{r.status}</td><td><button onClick={async () => { try { await downloadApi(`/documents/issued/${r.token}/pdf`, `${r.document_type}.pdf`) } catch (e) { setMessage(e.message) } }}>Download PDF</button> <a href={`/verify-document/${r.token}`} target="_blank" rel="noreferrer">Verify</a>{admin && r.status === 'valid' && <button disabled={busy} onClick={() => revoke(r)}>Revoke</button>}{admin && r.status !== 'replaced' && <button onClick={() => setForm(f => ({ ...f, student_id: String(r.student_id), document_type: r.document_type, title: r.title, body: '', exam_id: '', replaces: r.token, reason: '' }))}>Prepare replacement</button>}</td></tr>)}</tbody></table></div>
  </section>
}
