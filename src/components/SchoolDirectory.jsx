import { Building2, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Edit3, Eye, Image as ImageIcon, Power, PowerOff, Save, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { schoolApi, schoolLogoUrl } from '../lib/api'
import { confirmPopup } from '../lib/confirmPopup'

export default function SchoolDirectory({ rows, reload }) {
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [directoryRows, setDirectoryRows] = useState(rows || [])
  const [statusTab, setStatusTab] = useState('active')
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: rows?.length || 0, total_pages: 1 })

  async function loadDirectory(nextPage = page) {
    setBusy(true)
    try {
      const result = await schoolApi.superAdminSchools({ status: statusTab, search, plan, page: nextPage, per_page: 10 })
      setDirectoryRows(result.schools || [])
      setPagination(result.pagination || { page: nextPage, per_page: 10, total: (result.schools || []).length, total_pages: 1 })
      setPage(result.pagination?.page || nextPage)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadDirectory(1), 180)
    return () => clearTimeout(timer)
    // The timer intentionally reloads from the latest filter state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, search, plan])

  async function open(item, edit = false) {
    setBusy(true)
    setError('')
    setMessage('')
    setImagePreview('')
    try {
      const [result, subscriptionResult] = await Promise.all([schoolApi.school(item.id), schoolApi.schoolSubscription(item.id)])
      setSelected({ ...result.school, subscription: subscriptionResult.subscription })
      setEditing(edit)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function schoolImage(school) {
    return school?.logoPreview || (school?.logoPath ? schoolLogoUrl(school.logoPath) : '')
  }

  function chooseLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setSelected(current => ({ ...current, logoFile: file, logoPreview: preview }))
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const values = new FormData()
      values.append('schoolName', selected.schoolName || '')
      values.append('adminEmail', selected.adminEmail || '')
      values.append('planSetup', selected.planSetup || 'Standard')
      if (selected.logoFile) values.append('logo', selected.logoFile)
      const result = await schoolApi.updateSchool(selected.id, values)
      const subscription = await schoolApi.updateSchoolSubscription(selected.id, { plan: selected.planSetup, status: selected.subscription?.status || 'active', trial_ends_at: selected.subscription?.trial_ends_at || '', plan_ends_at: selected.subscription?.plan_ends_at || '', reason: selected.subscription?.notes || '' })
      setSelected({ ...result.school, subscription: subscription.subscription })
      setEditing(false)
      setMessage(result.message)
      await loadDirectory()
      if (reload) await reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(item) {
    const next = item.status === 'active' ? 'inactive' : 'active'
    const warning = next === 'inactive' ? ' Users will not be able to log in and active refresh sessions will be revoked.' : ''
    if (!await confirmPopup({ title: `${next === 'active' ? 'Activate' : 'Deactivate'} ${item.schoolName}?`, message: warning.trim() || 'Users will be able to sign in again.', confirmLabel: next === 'active' ? 'Activate school' : 'Deactivate school', tone: next === 'active' ? 'primary' : 'danger' })) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await schoolApi.updateSchoolStatus(item.id, next)
      setMessage(result.message)
      if (selected?.id === item.id) setSelected(current => ({ ...current, ...result.school }))
      await loadDirectory()
      if (reload) await reload()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const selectedImage = schoolImage(selected)

  return <>
    <section className="data-panel school-directory">
      <div className="panel-title"><div><span>Super Admin control</span><h2>School directory</h2></div><b>{pagination.total} schools</b></div>
      <div className="school-directory-toolbar"><div className="school-status-tabs"><button className={statusTab === 'active' ? 'active' : ''} onClick={() => { setStatusTab('active'); setPage(1) }}>Active schools</button><button className={statusTab === 'inactive' ? 'active' : ''} onClick={() => { setStatusTab('inactive'); setPage(1) }}>Deactivated schools</button></div><div className="school-directory-filters"><label className="school-search"><Search size={16} /><input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Search school, domain or email" /></label><label><span>Plan</span><select value={plan} onChange={event => { setPlan(event.target.value); setPage(1) }}><option value="all">All plans</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option><option value="trial">Trial</option></select></label></div></div>
      {error && <div className="form-error school-crud-message">{error}</div>}{message && <div className="success-notice school-crud-message">{message}</div>}
      {directoryRows.length === 0 ? <div className="empty-state"><Building2 /><h3>{statusTab === 'active' ? 'No active schools found' : 'No deactivated schools found'}</h3><p>Adjust the search or filters to find a school.</p></div> : <div className="table-wrap"><table><thead><tr><th>School</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead><tbody>{directoryRows.map(item => <tr key={item.id}><td><div className="school-cell"><span className="school-logo">{item.logoPath ? <img src={schoolLogoUrl(item.logoPath)} alt={`${item.schoolName} logo`} /> : <Building2 />}</span><div><b>{item.schoolName}</b><small>{item.domain} · {item.adminEmail}</small></div></div></td><td>{item.planSetup || '—'}</td><td><span className={`status-pill ${item.status === 'inactive' ? 'inactive' : ''}`}>{item.status}</span></td><td><div className="student-row-actions"><button onClick={() => open(item)} disabled={busy}><Eye />View</button><button onClick={() => open(item, true)} disabled={busy}><Edit3 />Edit</button><button className={item.status === 'active' ? 'danger' : 'activate'} onClick={() => toggle(item)} disabled={busy}>{item.status === 'active' ? <PowerOff /> : <Power />}{item.status === 'active' ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>}
      <div className="school-pagination"><span>Page {pagination.page} of {pagination.total_pages}</span><div><button onClick={() => loadDirectory(1)} disabled={busy || pagination.page <= 1} aria-label="First page" title="First page"><ChevronFirst /></button><button onClick={() => loadDirectory(pagination.page - 1)} disabled={busy || pagination.page <= 1} aria-label="Previous page" title="Previous page"><ChevronLeft /></button><button onClick={() => loadDirectory(pagination.page + 1)} disabled={busy || pagination.page >= pagination.total_pages} aria-label="Next page" title="Next page"><ChevronRight /></button><button onClick={() => loadDirectory(pagination.total_pages)} disabled={busy || pagination.page >= pagination.total_pages} aria-label="Last page" title="Last page"><ChevronLast /></button></div></div>
    </section>
    {selected && <section className="data-panel school-detail-card"><div className="panel-title"><div><span>{editing ? 'Edit school' : 'School details'}</span><h2>{selected.schoolName}</h2></div><button className="refresh-button" onClick={() => { setSelected(null); setImagePreview('') }}><X />Close</button></div>{editing ? <form className="student-edit-form" onSubmit={save}><div className="field-grid"><label>School name *<input required value={selected.schoolName || ''} onChange={e => setSelected({ ...selected, schoolName: e.target.value })} /></label><label>Administrator email *<input required type="email" value={selected.adminEmail || ''} onChange={e => setSelected({ ...selected, adminEmail: e.target.value })} /></label><label>Plan *<select value={selected.planSetup || 'Standard'} onChange={e => setSelected({ ...selected, planSetup: e.target.value })}><option>Standard</option><option>Premium</option><option>Enterprise</option><option>Trial</option></select></label><label>Login domain<input value={selected.domain || ''} readOnly /></label><label className="wide">School logo<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={chooseLogo} /><small className="field-help">Choose a new PNG, JPG or JPEG image.</small>{selectedImage && <button type="button" className="school-logo-preview" onClick={() => setImagePreview(selectedImage)}><img src={selectedImage} alt="Selected school logo preview" /><span>Open large preview</span></button>}</label></div>{error && <div className="form-error">{error}</div>}<button className="button button-small" disabled={busy}><Save />{busy ? 'Saving…' : 'Save school'}</button></form> : <div className="school-view-details"><button type="button" className="school-detail-logo-button" onClick={() => selectedImage && setImagePreview(selectedImage)} disabled={!selectedImage} aria-label="Open school logo"><span className="school-detail-logo">{selectedImage ? <img src={selectedImage} alt={`${selected.schoolName} logo`} /> : <ImageIcon />}</span><span>{selectedImage ? 'Click logo to view full size' : 'No school logo uploaded'}</span></button><dl className="student-details-grid"><div><dt>School name</dt><dd>{selected.schoolName}</dd></div><div><dt>Domain</dt><dd>{selected.domain}</dd></div><div><dt>Schema</dt><dd>{selected.schemaName}</dd></div><div><dt>Administrator</dt><dd>{selected.adminEmail || '—'}</dd></div><div><dt>Plan</dt><dd>{selected.planSetup || '—'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Created</dt><dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</dd></div></dl></div>}</section>}
    {imagePreview && <div className="school-image-lightbox" role="dialog" aria-modal="true" aria-label="School logo preview" onMouseDown={() => setImagePreview('')}><div className="school-image-lightbox-inner" onMouseDown={event => event.stopPropagation()}><button type="button" className="school-image-lightbox-close" onClick={() => setImagePreview('')} aria-label="Close image preview"><X /></button><img src={imagePreview} alt={`${selected?.schoolName || 'School'} logo enlarged`} /></div></div>}
  </>
}
