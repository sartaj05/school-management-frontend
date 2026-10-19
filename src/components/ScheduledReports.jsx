import {confirmPopup} from '../lib/confirmPopup'
import { CalendarClock, History, Mail, PauseCircle, Plus, Send, Smartphone } from 'lucide-react'
import { useCallback, useEffect, useState, useRef } from 'react'
import { api, schoolApi } from '../lib/api'

const empty = {
  report_key: 'attendance',
  export_format: 'pdf',
  schedule_type: 'daily',
  run_at: '09:00',
  weekday: 0,
  day_of_month: 1,
  timezone: 'Asia/Kolkata',
  channels: ['email'],
  email_recipients: '',
  whatsapp_recipients: '',
  filters: {},
}
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ScheduledReports() {
  const operations=useRef({})
  const [resolution,setResolution]=useState(null)
  const [catalog, setCatalog] = useState([])
  const [rows, setRows] = useState([])
  const [runs, setRuns] = useState({})
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const [catalogResult, scheduleResult] = await Promise.all([
        schoolApi.reportCatalog(),
        schoolApi.scheduledReports(),
      ])
      setCatalog(catalogResult.reports || [])
      setRows(scheduleResult.data || [])
      if (catalogResult.reports?.length) {
        setForm(current => catalogResult.reports.some(item => item.key === current.report_key)
          ? current
          : { ...current, report_key: catalogResult.reports[0].key })
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const selected = catalog.find(item => item.key === form.report_key) || {}
  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))
  const filter = (name, value) => setForm(current => ({ ...current, filters: { ...current.filters, [name]: value } }))
  const toggleChannel = channel => setForm(current => ({
    ...current,
    channels: current.channels.includes(channel)
      ? current.channels.filter(item => item !== channel)
      : [...current.channels, channel],
  }))

  async function create(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const save = editing ? values => schoolApi.updateScheduledReport(editing, values) : schoolApi.createScheduledReport
      const result = await save({
        ...form,
        weekday: Number(form.weekday),
        day_of_month: Number(form.day_of_month),
        email_recipients: form.email_recipients.split(',').map(item => item.trim()).filter(Boolean),
        whatsapp_recipients: form.whatsapp_recipients.split(',').map(item => item.trim()).filter(Boolean),
      })
      setMessage(result.message)
      setForm(empty)
      setEditing(null)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function edit(row) {
    setEditing(row.id)
    setForm({...empty,...row,run_at:String(row.run_at).slice(0,5),email_recipients:(row.email_recipients||[]).join(', '),whatsapp_recipients:(row.whatsapp_recipients||[]).join(', '),filters:{...row.filters}})
  }

  async function resume(id) {
    setBusy(true);setError('')
    try {await schoolApi.updateScheduledReport(id,{is_active:true});setMessage('Scheduled report resumed.');await load()}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }

  async function runNow(id) {
    const row=rows.find(item=>item.id===id)
    if(!await confirmPopup({title:'Deliver report now?',message:`This sends ${row.report_key} to ${[...(row.email_recipients||[]),...(row.whatsapp_recipients||[])].join(', ')}.`,confirmLabel:'Send report',tone:'primary'})) return
    setBusy(true)
    setError('')
    try {
      const key=`run:${id}`; operations.current[key] ||= crypto.randomUUID()
      const result = await api(`/scheduled-reports/${id}/run`,{method:'POST',headers:{'X-Client-Operation-Id':operations.current[key]}})
      delete operations.current[key]
      await viewRuns(id)
      setMessage(result.message + ' Delivery status is recorded below.')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function resolveUnknown(event){event.preventDefault();if(!await confirmPopup({title:'Record provider confirmation?',message:'This decision updates delivery history. Confirm that you checked the provider evidence.',confirmLabel:'Confirm outcome'}))return;setBusy(true);setError('');try{await api(`/scheduled-reports/${resolution.report}/runs/${resolution.run}/resolve`,{method:'POST',body:JSON.stringify(resolution)});await viewRuns(resolution.report);setResolution(null)}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function retryFailed(id,run) {
    if(!await confirmPopup({title:'Retry failed recipients?',message:'Only confirmed failed recipients will be retried. Successful and unknown deliveries will not be resent.',confirmLabel:'Retry failed',tone:'primary'}))return
    setBusy(true);setError('')
    const key=`retry:${id}:${run}`;operations.current[key] ||= crypto.randomUUID()
    try {await api(`/scheduled-reports/${id}/runs/${run}/retry`,{method:'POST',headers:{'X-Client-Operation-Id':operations.current[key]}});delete operations.current[key];await viewRuns(id)}
    catch(e){setError(e.message)}finally{setBusy(false)}
  }

  async function pause(id) {
    setBusy(true)
    setError('')
    try {
      const result = await schoolApi.pauseScheduledReport(id)
      setMessage(result.message)
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function viewRuns(id) {
    setError('')
    try {
      const result = await schoolApi.scheduledReportRuns(id)
      setRuns(current => ({ ...current, [id]: result.data || [] }))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="scheduled-reports">
      <section className="people-hero scheduled-reports-hero">
        <div>
          <span>Automation</span>
          <h2>Reports delivered on time.</h2>
          <p>Schedule native PDF, XLSX or CSV reports for email or WhatsApp delivery.</p>
        </div>
        <CalendarClock />
      </section>

      <section className="data-panel scheduled-editor">
        <div className="panel-title">
          <div><span>{editing ? `Edit schedule #${editing}` : 'New schedule'}</span><h2>Automate a report</h2></div>
          <b>{rows.filter(row => row.is_active).length} active</b>
        </div>
        <form className="scheduled-form" onSubmit={create}>
          <label>Report
            <select value={form.report_key} onChange={event => field('report_key', event.target.value)}>
              {catalog.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <small>{selected.description}</small>
          </label>
          <label>Export format
            <select value={form.export_format} onChange={event => field('export_format', event.target.value)}>
              <option value="pdf">PDF</option>
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
            </select>
            <small>Native attachment format</small>
          </label>
          <label>Frequency
            <select value={form.schedule_type} onChange={event => field('schedule_type', event.target.value)}>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </label>
          <label>Run at
            <input type="time" value={form.run_at} onChange={event => field('run_at', event.target.value)} />
          </label>
          {form.schedule_type === 'weekly' && <label>Weekday
            <select value={form.weekday} onChange={event => field('weekday', event.target.value)}>
              {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
            </select>
          </label>}
          {form.schedule_type === 'monthly' && <label>Day of month
            <select value={form.day_of_month} onChange={event => field('day_of_month', event.target.value)}>
              {Array.from({ length: 28 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>}
          <label>Timezone
            <select value={form.timezone} onChange={event => field('timezone', event.target.value)}>
              <option>Asia/Kolkata</option><option>UTC</option><option>Asia/Dubai</option><option>Asia/Singapore</option>
            </select>
          </label>
          <div className="scheduled-channel-picker">
            <span>Delivery channels</span>
            <label><input type="checkbox" checked={form.channels.includes('email')} onChange={() => toggleChannel('email')} /><Mail size={15} />Email</label>
            <label><input type="checkbox" checked={form.channels.includes('whatsapp')} onChange={() => toggleChannel('whatsapp')} /><Smartphone size={15} />WhatsApp</label>
          </div>
          <label className="wide">Email recipients <small>Comma-separated addresses</small>
            <input value={form.email_recipients} onChange={event => field('email_recipients', event.target.value)} placeholder="principal@school.com, office@school.com" />
          </label>
          <label className="wide">WhatsApp recipients <small>Comma-separated numbers with country code</small>
            <input value={form.whatsapp_recipients} onChange={event => field('whatsapp_recipients', event.target.value)} placeholder="919876543210" />
          </label>
          {selected.filters?.includes('from_date') && <label>From date
            <input type="date" value={form.filters.from_date || ''} onChange={event => filter('from_date', event.target.value)} />
          </label>}
          {selected.filters?.includes('to_date') && <label>To date
            <input type="date" value={form.filters.to_date || ''} onChange={event => filter('to_date', event.target.value)} />
          </label>}
          {selected.filters?.includes('class_name') && <label>Class filter
            <input value={form.filters.class_name || ''} onChange={event => filter('class_name', event.target.value)} placeholder="All classes" />
          </label>}
          {selected.filters?.includes('section') && <label>Section filter
            <input value={form.filters.section || ''} onChange={event => filter('section', event.target.value)} placeholder="All sections" />
          </label>}
          <div className="scheduled-actions">
            <button className="button button-small" disabled={busy}><Plus size={16} />{busy ? 'Saving...' : editing ? 'Save schedule' : 'Create schedule'}</button>{editing&&<button type="button" disabled={busy} onClick={()=>{setEditing(null);setForm(empty)}}>Cancel editing</button>}
          </div>
        </form>
        {error && <div className="form-error scheduled-message">{error}</div>}
        {message && <div className="success-notice scheduled-message">{message}</div>}
      </section>

      <section className="data-panel scheduled-list">
        <div className="panel-title">
          <div><span>Delivery schedule</span><h2>Scheduled reports</h2></div>
          <b>{rows.length} total</b>
        </div>
        {rows.length === 0
          ? <div className="empty-state"><CalendarClock /><h3>No schedules yet</h3><p>Create one above to automate your first report.</p></div>
          : <div className="table-wrap"><table><thead><tr><th>Report</th><th>Format</th><th>Frequency</th><th>Recipients</th><th>Next run</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {rows.map(row => <tr key={row.id}>
              <td><b>{row.report_key.replaceAll('_', ' ')}</b><small>{row.timezone}</small></td>
              <td>{String(row.export_format || 'csv').toUpperCase()}</td>
              <td>{row.schedule_type} at {String(row.run_at).slice(0, 5)}</td>
              <td><small>{[...(row.email_recipients || []), ...(row.whatsapp_recipients || [])].join(', ') || '—'}</small></td>
              <td>{row.next_run_at ? new Date(row.next_run_at + 'Z').toLocaleString() : '—'}</td>
              <td><span className={'status-pill ' + (row.is_active ? '' : 'inactive')}>{row.is_active ? 'Active' : 'Paused'}</span></td>
              <td><div className="student-row-actions"><button disabled={busy} onClick={()=>edit(row)}>Edit</button>{!row.is_active&&<button disabled={busy} onClick={()=>resume(row.id)}>Resume</button>}<button onClick={() => runNow(row.id)} disabled={busy}><Send />Run now</button><button onClick={() => viewRuns(row.id)} disabled={busy}><History />Runs</button>{row.is_active && <button className="danger" onClick={() => pause(row.id)} disabled={busy}><PauseCircle />Pause</button>}</div></td>
            </tr>)}
          </tbody></table></div>}
        {resolution&&<form className="editor-card" onSubmit={resolveUnknown}><h3>Review unknown delivery · {resolution.recipient}</h3><label>Confirmed outcome<select value={resolution.outcome} onChange={e=>setResolution({...resolution,outcome:e.target.value})}><option value="delivered">Confirmed delivered</option><option value="not_delivered">Confirmed not delivered</option></select></label><label>Provider evidence<textarea required minLength={10} maxLength={2000} value={resolution.evidence} onChange={e=>setResolution({...resolution,evidence:e.target.value})} placeholder="Provider reference, checked time and confirmation details"/></label><button disabled={busy}>Record provider confirmation</button><button type="button" disabled={busy} onClick={()=>setResolution(null)}>Cancel</button></form>}
      {Object.entries(runs).map(([id, items]) => <div className="scheduled-run-history" key={id}>
          <h3>Run history · schedule {id}</h3>
          {items.length === 0 ? <p>No delivery runs recorded yet.</p> : <ul>{items.map(item => <li key={item.id}><b>{String(item.status || '').toUpperCase()}</b> · {item.record_count || 0} records · {item.started_at ? new Date(item.started_at).toLocaleString() : '—'}{item.error ? ' · ' + item.error : ''}{(item.delivery_results||[]).map((r,index)=><div key={index}>{r.channel} · {r.recipient} · {r.status || (r.success?'sent':'failed')} · Attempts: {r.attempts??1}{r.result?.resolution&&<p>Provider review: {r.result.resolution.outcome} · {r.result.resolution.evidence}</p>}{r.status==='unknown'&&<button disabled={busy||item.status==='running'} onClick={()=>setResolution({report:Number(id),run:item.id,channel:r.channel,recipient:r.recipient,expected_attempts:r.attempts,outcome:'delivered',evidence:''})}>Review unknown delivery</button>}</div>)}{item.uncertain_count>0&&<p>Unknown delivery: verify with the provider before any resend.</p>}{item.retryable_count>0&&<button disabled={busy} onClick={()=>retryFailed(id,item.id)}>Retry failed recipients</button>}</li>)}</ul>}
        </div>)}
      </section>
    </section>
  )
}
