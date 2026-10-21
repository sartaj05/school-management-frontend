import test from 'node:test'
import assert from 'node:assert/strict'
import {readMarkDraft,saveMarkDraft,clearAllMarkDrafts,recoverMarkRows} from '../src/lib/markDrafts.js'
function storage(){return {getItem(k){return this[k]??null},setItem(k,v){this[k]=v},removeItem(k){delete this[k]}}}
function login(user){sessionStorage.setItem('school_access_token',`a.${btoa(JSON.stringify({schema_context:'school_a',sub:user}))}.c`)}
test('mark drafts isolate accounts expire and clear on logout',()=>{
  globalThis.localStorage=storage();globalThis.sessionStorage=storage()
  login('1');assert.equal(saveMarkDraft(1,2,[{student_id:1,revision:3,marks_obtained:80}]),true)
  assert.equal(readMarkDraft(1,2).rows[0].marks_obtained,80)
  login('2');assert.equal(readMarkDraft(1,2),null)
  login('1');const k=Object.keys(localStorage).find(k=>k.startsWith('school-mark-draft:'))
  const old=JSON.parse(localStorage[k]);old.savedAt=Date.now()-8*86400000;localStorage[k]=JSON.stringify(old)
  assert.equal(readMarkDraft(1,2),null)
  saveMarkDraft(1,2,[]);clearAllMarkDrafts();assert.equal(readMarkDraft(1,2),null)
})
test('reviewed recovery retains server revisions and excludes removed students',()=>{
  const result=recoverMarkRows([{student_id:1,revision:5,marks_obtained:90}],{rows:[{student_id:1,revision:2,marks_obtained:75},{student_id:2,revision:1,marks_obtained:20}]})
  assert.deepEqual(result,[{student_id:1,revision:5,marks_obtained:75}])
})
