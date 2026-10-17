import {test,expect} from '@playwright/test'

for (const width of [390,1440]) {
  test.describe(`connected school features at ${width}px`,()=>{
    test.beforeEach(async({page})=>{ await page.setViewportSize({width,height:900}) })
    test.afterEach(async({page})=>{ expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true) })
    test('inbox filters employee leave and reviews with notes',async({page})=>{
      let reviewed=false
      await page.route('**/dashboard/approvals?*',r=>r.fulfill({json:{counts:{employee_leave:reviewed?0:1},total:reviewed?0:1,data:reviewed?[]:[{id:1,kind:'employee_leave',person:'Class teacher',detail:'Appointment',method:'sick',status:'Pending'}]}}))
      await page.route('**/leave/requests/1/status',r=>{expect(r.request().postDataJSON().notes).toBe('Cover arranged');reviewed=true;return r.fulfill({json:{success:true}})})
      await page.goto('/e2e/connected_features_harness.html?module=inbox')
      await page.getByLabel('Request type').selectOption('employee_leave')
      await page.getByLabel('Review notes for employee_leave #1').fill('Cover arranged')
      await page.getByRole('button',{name:'Approve',exact:true}).click()
      await page.getByRole('button',{name:'Confirm decision'}).click()
      await expect(page.getByRole('heading',{name:'Approval inbox · 0 pending'})).toBeVisible()
    })
    test('reminder settings save numeric days and display queue status',async({page})=>{
      let settings={enabled:false,offsets:[-3,0,7],hour:9,timezone:'Asia/Kolkata',channel:'portal'}
      await page.route('**/fees/reminder-policy',r=>{ if(r.request().method()==='PUT'){settings=r.request().postDataJSON();expect(settings.offsets).toEqual([-2,0,5])} return r.fulfill({json:{settings,deliveries:[{id:1,created_at:'2026-10-16',channel:'portal',status:'sent',attempt_count:1}],run:{queued:1,skipped_preferences:0,missing_contacts:0}}}) })
      await page.goto('/e2e/connected_features_harness.html?module=reminders')
      await page.getByLabel('Enable automatic reminders').check()
      await page.getByLabel('Days relative to due date').fill('-2, 0, 5')
      await page.getByRole('button',{name:'Save reminder rules'}).click()
      await expect(page.getByRole('status')).toHaveText('Reminder rules saved.')
      await page.getByRole('button',{name:'Queue reminders due now'}).click()
      await expect(page.getByRole('status')).toContainText('1 reminders queued')
      await expect(page.getByRole('cell',{name:'sent',exact:true})).toBeVisible()
    })
    test('certificate issue and revoke update verification status',async({page})=>{
      let rows=[]
      const token='a'.repeat(48)
      await page.route('**/documents/issued/options',r=>r.fulfill({json:{students:[{id:1,name:'Aarav',class_name:'Grade 5',section:'A'}],exams:[]}}))
      await page.route('**/documents/issued',r=>{ if(r.request().method()==='POST') {const d=r.request().postDataJSON();expect(d.student_id).toBe(1);rows=[{...d,student_name:'Aarav',token,status:'valid',issued_at:'2026-10-16'}]} return r.fulfill({json:{data:rows,token}}) })
      await page.route('**/documents/issued/*/revoke',r=>{expect(r.request().postDataJSON().reason).toBe('Incorrect period');rows[0].status='revoked';return r.fulfill({json:{success:true}})})
      await page.goto('/e2e/connected_features_harness.html?module=documents')
      await page.getByRole('combobox',{name:'Student',exact:true}).selectOption('1')
      await page.getByLabel('Certificate title',{exact:true}).fill('Attendance certificate')
      await page.getByLabel('Certificate text',{exact:true}).fill('Attended the school during this academic year.')
      await page.getByRole('button',{name:'Issue document',exact:true}).click()
      await expect(page.getByRole('cell',{name:'valid',exact:true})).toBeVisible()
      await page.getByLabel('Reason for revocation / replacement').fill('Incorrect period')
      await page.getByRole('button',{name:'Revoke',exact:true}).click()
      await page.getByRole('alertdialog').getByRole('button',{name:'Revoke',exact:true}).click()
      await expect(page.getByRole('cell',{name:'revoked',exact:true})).toBeVisible()
    })
    test('offline retry retains operation ID and isolates accounts',async({page})=>{
      await page.addInitScript(()=>sessionStorage.setItem('school_access_token',`header.${btoa(JSON.stringify({sub:'1',schema_context:'school_a'}))}.signature`))
      let online=false,operation
      await page.route('**/api/v1/leave/requests',r=>{const id=r.request().headers()['x-client-operation-id'];operation??=id;expect(id).toBe(operation);return online?r.fulfill({json:{success:true}}):r.abort('internetdisconnected')})
      await page.goto('/e2e/connected_features_harness.html?module=offline')
      const queued=await page.evaluate(async()=>{const m=await import('/src/lib/offlineDrafts.js');return m.submitDraft('leave:student:1','/leave/requests',{reason:'Appointment'})})
      expect(queued.queued).toBe(true)
      await expect(page.getByRole('button',{name:'Retry submission'})).toBeVisible()
      expect(await page.evaluate(async()=>{const m=await import('/src/lib/offlineDrafts.js');const old=sessionStorage.getItem('school_access_token');sessionStorage.setItem('school_access_token',`header.${btoa(JSON.stringify({sub:'2',schema_context:'school_a'}))}.signature`);const count=Object.keys(m.savedDrafts()).length;sessionStorage.setItem('school_access_token',old);return count})).toBe(0)
      online=true
      await page.getByRole('button',{name:'Retry submission'}).click()
      await expect(page.getByText('No queued submissions.')).toBeVisible()
    })
    test('public verification reports revoked documents with masked identity',async({page})=>{
      await page.route('**/api/v1/documents/verify/*',r=>r.fulfill({json:{data:{status:'revoked',school_name:'Green Valley School',title:'Report card',student_name:'A*** S***',issued_at:'2026-10-16',sha256:'f'.repeat(64)}}}))
      await page.goto(`/verify-document/${'a'.repeat(48)}`)
      await expect(page.getByRole('heading',{name:'Revoked — no longer valid'})).toBeVisible()
      await expect(page.getByText('A*** S***',{exact:true})).toBeVisible()
    })
  })
}
