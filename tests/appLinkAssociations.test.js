import { test } from 'node:test'
import assert from 'node:assert/strict'
import { associations } from '../scripts/app-link-associations.mjs'

const config={host:'portal.myschool.edu',fingerprint:Array(32).fill('AB').join(':'),teamId:'AB12CD34EF'}
test('association documents agree with the registered app and route paths',()=>{
  const result=associations(config)
  assert.equal(result['assetlinks.json'][0].target.package_name,'com.wis.vidyasetu')
  assert.equal(result['apple-app-site-association'].applinks.details[0].appID,'AB12CD34EF.com.wis.vidyasetu')
  assert.deepEqual(result['apple-app-site-association'].applinks.details[0].paths,['/app/*','/verify-document/*'])
})
test('missing credentials and placeholder domains cannot generate deployment files',()=>{
  for(const host of ['', 'links.invalid','portal.example.com','https://school.edu','school.edu/path','127.0.0.1','a..edu'])assert.throws(()=>associations({...config,host}))
  assert.throws(()=>associations({...config,fingerprint:'debug'}))
  assert.throws(()=>associations({...config,teamId:''}))
})
