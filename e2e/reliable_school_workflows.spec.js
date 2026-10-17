import {test,expect} from '@playwright/test'
import {Buffer} from 'node:buffer'

for(const width of [390,1440]) {
  test(`action inbox replies and attendance decisions at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900})
    let items=[{id:7,kind:'salary_query',person:'Priya',detail:'Explain deduction',method:'Salary question',status:'Awaiting response'},{id:8,kind:'attendance_correction',person:'Ananya',detail:'absent to present',method:'Attendance correction',status:'Pending'}],answers=[]
    await page.route('**/api/v1/**',r=>{
      const p=new URL(r.request().url()).pathname
      if(r.request().method()==='POST'){answers.push({path:p,body:r.request().postDataJSON()});items=items.filter(i=>!p.includes(`/${i.id}/`));return r.fulfill({json:{success:true}})}
      return r.fulfill({json:{data:items,total:items.length,counts:{all:items.length}}})
    })
    await page.goto('/e2e/connected_features_harness.html?module=inbox')
    await page.getByLabel('Review notes for salary_query #7').fill('Deduction is for one unpaid leave day')
    await page.getByRole('button',{name:'Send reply'}).click();await page.getByRole('button',{name:'Confirm decision'}).click()
    await expect(page.getByText('Explain deduction',{exact:true})).toHaveCount(0)
    expect(answers[0].path).toContain('/payroll/queries/7/answer');expect(answers[0].body.response).toContain('unpaid leave')
    await page.getByLabel('Review notes for attendance_correction #8').fill('Verified register')
    await page.getByRole('button',{name:'Approve',exact:true}).click();await page.getByRole('button',{name:'Confirm decision'}).click()
    await expect(page.getByText('No pending requests in this view.')).toBeVisible()
    expect(answers[1].path).toContain('/attendance/corrections/8/review')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })

  test(`batch preview generation retry and ZIP at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900})
    let jobs=[],previewed=false,queued=false,retried=false
    const job={id:'abc',payload:{class_name:'Grade 1',section:'A',document_type:'certificate'},total:2,completed:1,pending:0,failed:1}
    await page.route('**/api/v1/documents/**',r=>{
      const path=new URL(r.request().url()).pathname,method=r.request().method()
      if(path.endsWith('/options'))return r.fulfill({json:{students:[{id:1,name:'Ananya',class_name:'Grade 1',section:'A'},{id:2,name:'Kabir',class_name:'Grade 1',section:'A'}],templates:[],exams:[]}})
      if(path.endsWith('/batches/preview')){previewed=true;expect(r.request().postDataJSON().class_name).toBe('Grade 1');return r.fulfill({contentType:'application/pdf',body:Buffer.from('%PDF-1.4\n%%EOF')})}
      if(path.endsWith('/batches')&&method==='POST'){expect(previewed).toBe(true);expect(r.request().headers()['x-client-operation-id']).toBeTruthy();queued=true;jobs=[job];return r.fulfill({status:202,json:{id:'abc'}})}
      if(path.endsWith('/batches'))return r.fulfill({json:{data:jobs}})
      if(path.endsWith('/retry')){retried=true;jobs=[{...job,completed:2,failed:0}];return r.fulfill({json:{retried:1}})}
      if(path.endsWith('/zip'))return r.fulfill({contentType:'application/zip',headers:{'content-disposition':'attachment; filename=class-documents.zip'},body:Buffer.from('PK-test')})
      if(path.endsWith('/batches/abc'))return r.fulfill({json:{data:[{student_id:2,student_name:'Kabir',status:retried?'complete':'failed',error:retried?null:'Missing marks'}]}})
      return r.fulfill({json:{data:[]}})
    })
    await page.goto('/e2e/next_workflows_harness.html?module=documents&admin=true')
    await page.getByLabel('Batch class and section').selectOption('["Grade 1","A"]')
    await page.getByLabel('Batch certificate title').fill('Achievement')
    await page.getByLabel('Batch certificate text').fill('For excellent progress')
    await expect(page.getByRole('button',{name:'Generate class documents'})).toBeDisabled()
    await page.getByRole('button',{name:'Preview batch sample'}).click()
    await expect(page.getByTitle('Batch PDF preview')).toBeVisible()
    await page.getByRole('button',{name:'Generate class documents'}).click()
    await expect(page.getByText('1/2 complete · 0 queued or processing · 1 failed')).toBeVisible();expect(queued).toBe(true)
    await page.getByRole('button',{name:'View student results'}).click();await expect(page.getByText('Kabir: failed · Missing marks')).toBeVisible()
    await page.getByRole('button',{name:'Retry failed students'}).click();await expect(page.getByText('2/2 complete · 0 queued or processing · 0 failed')).toBeVisible()
    const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download ZIP'}).click();expect((await downloaded).suggestedFilename()).toBe('class-documents.zip')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}

test('student search reaches later records and messages refresh incrementally',async({page})=>{
  const requests=[]
  await page.route('**/api/v1/**',r=>{
    const u=new URL(r.request().url());requests.push(u.pathname+u.search)
    if(u.pathname.endsWith('/students'))return r.fulfill({json:{data:u.searchParams.get('q')==='Learner 135'?[{id:135,first_name:'Learner',last_name:'135',class_name:'Grade 1',section:'A'}]:[],has_more:false}})
    if(u.pathname.endsWith('/recipients'))return r.fulfill({json:{data:[{id:4,name:'Priya',role:'Teacher'}]}})
    if(u.pathname.endsWith('/read'))return r.fulfill({json:{success:true}})
    if(u.pathname.endsWith('/threads/5')){
      const older=u.searchParams.has('before_id'),after=u.searchParams.has('after_id')
      return r.fulfill({json:{data:{thread:{id:5,subject:'Progress'},messages:after?[]:[{id:older?1:31,body:older?'Earlier discussion':'Latest message',created_at:'2026-10-17T10:00:00Z',sender_name:'Priya'}],has_more:!older&&!after}}})
    }
    return r.fulfill({json:{data:[{id:5,subject:'Progress',student_name:'Learner 135'}],has_more:false}})
  })
  await page.goto('/e2e/next_workflows_harness.html?module=messages')
  await page.getByLabel('Search students').fill('Learner 135');await page.getByRole('combobox',{name:'Student',exact:true}).selectOption('135')
  await expect(page.getByLabel('Recipient')).toContainText('Priya')
  await page.getByRole('button',{name:'Progress'}).click();await page.getByRole('button',{name:'Load earlier messages'}).click()
  await expect(page.getByText('Earlier discussion',{exact:true})).toBeVisible();await expect(page.getByText('Latest message',{exact:true})).toBeVisible()
  await page.waitForTimeout(16000)
  expect(requests.some(p=>p.endsWith('after_id=31'))).toBe(true)
})
