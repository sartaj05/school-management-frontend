const prefix='school-mark-draft:'
const ttl=7*24*60*60*1000
function owner(){
  try{const raw=sessionStorage.getItem('school_access_token').split('.')[1];const c=JSON.parse(atob(raw.replaceAll('-','+').replaceAll('_','/')));return c.sub&&c.schema_context?`${c.schema_context}:${c.sub}`:null}catch{return null}
}
function key(exam,subject){const scope=owner();return scope?`${prefix}${scope}:${exam}:${subject}`:null}
export function pruneMarkDrafts(){
  for(const k of Object.keys(localStorage).filter(k=>k.startsWith(prefix))){
    try{const d=JSON.parse(localStorage.getItem(k));if(!Number.isFinite(d.savedAt)||Date.now()-d.savedAt>ttl||!Array.isArray(d.rows))localStorage.removeItem(k)}catch{localStorage.removeItem(k)}
  }
}
export function readMarkDraft(exam,subject){try{pruneMarkDrafts();const k=key(exam,subject);return k?JSON.parse(localStorage.getItem(k)||'null'):null}catch{return null}}
export function saveMarkDraft(exam,subject,rows){
  const k=key(exam,subject);if(!k)return false
  try{pruneMarkDrafts();localStorage.setItem(k,JSON.stringify({savedAt:Date.now(),rows}));return true}catch{return false}
}
export function clearMarkDraft(exam,subject){const k=key(exam,subject);if(k)localStorage.removeItem(k)}
export function clearAllMarkDrafts(){for(const k of Object.keys(localStorage).filter(k=>k.startsWith(prefix)))localStorage.removeItem(k)}
export function recoverMarkRows(latest,draft){
  const fields=['max_marks','marks_obtained','result_status','grade','remarks']
  return latest.map(row=>{const old=draft.rows.find(s=>s.student_id===row.student_id);if(!old)return row
    return {...row,...Object.fromEntries(fields.filter(f=>f in old).map(f=>[f,old[f]]))}})
}
