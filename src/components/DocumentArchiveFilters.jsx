export default function DocumentArchiveFilters({filters,onChange,page,total,pageSize=25,onPage,batch=false}) {
  const field=(key,value)=>onChange({...filters,[key]:value})
  return <div aria-label={batch?'Batch archive filters':'Document archive filters'}>
    <div className="field-grid">
      <label>Search {batch?'tasks':'student or document'}<input value={filters.q||''} onChange={e=>field('q',e.target.value)}/></label>
      <label>Class<input value={filters.class_name||''} onChange={e=>field('class_name',e.target.value)}/></label>
      <label>Type<select value={filters.document_type||''} onChange={e=>field('document_type',e.target.value)}><option value="">All types</option><option value="certificate">Certificate</option><option value="report_card">Report card</option></select></label>
      <label>Status<select value={filters.status||''} onChange={e=>field('status',e.target.value)}><option value="">All statuses</option>{(batch?['pending','complete','failed','cancelled']:['valid','revoked','replaced']).map(s=><option key={s} value={s}>{s}</option>)}</select></label>
      <label>From date<input type="date" value={filters.from||''} onChange={e=>field('from',e.target.value)}/></label>
      <label>To date<input type="date" value={filters.to||''} onChange={e=>field('to',e.target.value)}/></label>
    </div>
    <div className="student-row-actions"><button disabled={page<=1} onClick={()=>onPage(page-1)}>Previous {batch?'tasks':'documents'}</button><span>Page {page} · {total} results</span><button disabled={page*pageSize>=total} onClick={()=>onPage(page+1)}>Next {batch?'tasks':'documents'}</button></div>
  </div>
}
