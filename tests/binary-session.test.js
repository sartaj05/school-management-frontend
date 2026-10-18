import test from 'node:test'
import {Buffer} from 'node:buffer'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

test('binary previews and downloads share one refresh and preserve the request', async () => {
  const source=readFileSync(new URL('../src/lib/api.js',import.meta.url),'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL',"''")
  const store=new Map([['school_access_token','expired'],['school_refresh_token','refresh']])
  const originals={fetch:globalThis.fetch,sessionStorage:globalThis.sessionStorage,document:globalThis.document}
  globalThis.sessionStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}
  let refreshes=0,clicks=0;const calls=[]
  globalThis.document={body:{appendChild(){}},createElement:()=>({click(){clicks++},remove(){}})}
  globalThis.fetch=async (url,options)=>{
    calls.push({url,options})
    if(url.endsWith('/auth/refresh')){refreshes++;await new Promise(resolve=>setTimeout(resolve,10));return Response.json({token:'new',refresh_token:'rotated'})}
    if(options.headers.Authorization!=='Bearer new')return Response.json({message:'Expired'},{status:401})
    return new Response('%PDF-test',{headers:{'content-type':'application/pdf'}})
  }
  try {
    const {blobApi,downloadApi}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
    const [pdf]=await Promise.all([blobApi('/preview',{method:'POST',body:'{"student_id":2}'}),downloadApi('/download','school.pdf')])
    assert.equal(await pdf.text(),'%PDF-test');assert.equal(refreshes,1);assert.equal(clicks,1)
    assert.equal(calls.filter(c=>c.url.endsWith('/preview')).length,2)
    assert.equal(calls.findLast(c=>c.url.endsWith('/preview')).options.body,'{"student_id":2}')
    assert.equal(calls.findLast(c=>c.url.endsWith('/preview')).options.method,'POST')
  } finally {Object.assign(globalThis,originals)}
})
