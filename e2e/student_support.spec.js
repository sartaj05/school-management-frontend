import {test,expect} from '@playwright/test'
for(const width of [390,1440]){
  test(`scheduled report edit resume and confirmed send ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let active=false,email='office@example.test',sent=0
    await page.route('**/api/v1/reports/catalog',r=>r.fulfill({json:{reports:[{key:'attendance',label:'Attendance',filters:[]}]}}))
    await page.route('**/api/v1/scheduled-reports**',r=>{
      if(r.request().url().endsWith('/run'))sent++
      if(r.request().method()==='PATCH'){const p=r.request().postDataJSON();if('is_active'in p)active=p.is_active;if(p.email_recipients)email=p.email_recipients[0]}
      return r.fulfill({json:{message:'Saved',data:[{id:1,report_key:'attendance',export_format:'pdf',schedule_type:'daily',run_at:'09:00',timezone:'Asia/Kolkata',channels:['email'],email_recipients:[email],is_active:active}]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=schedules')
    await page.getByRole('button',{name:'Edit',exact:true}).click()
    await page.getByLabel('Email recipients',{exact:false}).fill('principal@example.test')
    await page.getByRole('button',{name:'Save schedule',exact:true}).click()
    await expect.poll(()=>email).toBe('principal@example.test')
    await page.getByRole('button',{name:'Resume',exact:true}).click();await expect.poll(()=>active).toBe(true)
    await page.getByRole('button',{name:'Run now',exact:true}).click();expect(sent).toBe(0)
    await page.getByRole('button',{name:'Send report',exact:true}).click();await expect.poll(()=>sent).toBe(1)
  })
  test(`teacher correction request preserves published record ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let saved
    await page.route('**/api/v1/exams/corrections**',r=>{if(r.request().method()==='POST')saved=r.request().postDataJSON();return r.fulfill({json:{data:[],total:0}})})
    await page.goto('/e2e/student_support_harness.html?module=corrections&role=Teacher&request=1')
    await page.getByLabel('Obtained marks').fill('80');await page.getByLabel('Reason for correction').fill('Answer script verified')
    await page.getByRole('button',{name:'Send correction request'}).click()
    await expect.poll(()=>saved?.marks_obtained).toBe(80);expect(saved.exam_id).toBe(1)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`admin correction review has confirmation and history ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let status='pending'
    await page.route('**/api/v1/exams/corrections**',r=>{if(r.request().method()==='POST')status=r.request().postDataJSON().status;return r.fulfill({json:{total:1,data:[{id:1,student_name:'Asha',exam_name:'Term 1',subject_name:'Math',status,reason:'Script checked',original:{result_status:'graded',max_marks:100,marks_obtained:30},proposed:{result_status:'graded',max_marks:100,marks_obtained:80},replacement_tokens:status==='approved'?['new-token']:[]}]}})})
    await page.goto('/e2e/student_support_harness.html?module=corrections')
    await page.getByLabel('Review notes #1').fill('Approved after review');await page.getByRole('button',{name:'Approve',exact:true}).click();expect(status).toBe('pending')
    await page.getByRole('button',{name:'Confirm decision'}).click();await expect.poll(()=>status).toBe('approved')
    await expect(page.getByText('1 replacement report card(s) available in Documents.')).toBeVisible()
  })
  test(`support flags create and family sharing ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let saved
    await page.route('**/api/v1/exams/support/students?*',r=>r.fulfill({json:{total:1,data:[{id:1,student_name:'Asha',class_name:'5',section:'A',flags:[{kind:'attendance',detail:'3 of 6 recorded days; below 75%.'}],teachers:[{id:2,full_name:'Ms Singh'}]}]}}))
    await page.route('**/api/v1/exams/support/cases**',r=>{if(r.request().method()==='POST')saved=r.request().postDataJSON();return r.fulfill({json:{data:[],total:0}})})
    await page.goto('/e2e/student_support_harness.html?module=support')
    await page.getByText('Find students and review support flags',{exact:true}).click()
    await page.getByRole('button',{name:'Create support case',exact:true}).click()
    await page.getByLabel('Staff goal (private)').fill('Check attendance together')
    await page.getByLabel('Review date').fill('2026-11-01');await page.getByLabel('Family summary (shared)').fill('Weekly check-in')
    await page.getByRole('button',{name:'Save support case'}).click();expect(saved).toBeUndefined()
    await page.getByRole('button',{name:'Save and share'}).click();await expect.poll(()=>saved?.teacher_id).toBe(2)
    expect(saved.goal).toBe('Check attendance together');expect(saved.family_summary).toBe('Weekly check-in')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`family support is read only ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900})
    await page.route('**/api/v1/exams/support/cases**',r=>r.fulfill({json:{total:1,data:[{id:1,student_name:'Asha',teacher_name:'Ms Singh',review_date:'2026-11-01',status:'in_progress',family_summary:'Weekly practice',notes:[{shared:true,body:'Good progress'}]}]}}))
    await page.goto('/e2e/student_support_harness.html?module=support&role=Parent')
    await expect(page.getByText('Shared · Good progress')).toBeVisible();await expect(page.getByRole('button',{name:'Update follow-up'})).toHaveCount(0);await expect(page.getByLabel('Search student')).toHaveCount(0)
  })
}
