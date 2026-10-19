import {test,expect} from '@playwright/test'
for(const width of [390,1440]){
  test(`draft conflict preserves entries and reloads revision ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let loaded=0,saved=[],revision=2
    await page.route('**/api/v1/**',r=>{
      const p=new URL(r.request().url()).pathname
      if(p.endsWith('/options'))return r.fulfill({json:{classes:[{id:1,class_name:'5',section:'A'}],subjects:[{id:1,name:'Math',code:'M'}]}})
      if(p.endsWith('/students')){loaded++;return r.fulfill({json:{data:[{student_id:1,student_name:'Asha',max_marks:100,marks_obtained:loaded===1?70:80,result_status:'graded',revision}]}})}
      if(p.endsWith('/marks')){saved.push(r.request().postDataJSON());if(saved.length===1){revision=3;return r.fulfill({status:409,json:{message:'Marks changed. Reload latest marks.',code:'MARKS_CONFLICT'}})}return r.fulfill({json:{message:'Saved'}})}
      if(p.endsWith('/readiness'))return r.fulfill({json:{subjects:[],available_subjects:[],missing:[]}})
      if(p.endsWith('/corrections'))return r.fulfill({json:{data:[],total:0}})
      expect(p).toBe('/api/v1/exams')
      return r.fulfill({json:{data:[{id:1,name:'Term 1',class_name:'5',section:'A',academic_year:'2026-27',status:'draft'}]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=exams&role=Teacher')
    await page.getByRole('combobox',{name:'Exam',exact:true}).selectOption('1');await page.getByRole('combobox',{name:'Subject',exact:true}).selectOption('1')
    await page.getByRole('button',{name:'Load marks',exact:true}).click()
    const marks=page.locator('tbody input[type=number]').nth(1);await marks.fill('95')
    await page.getByRole('button',{name:'Save marks',exact:true}).click()
    await expect(page.getByRole('button',{name:'Reload latest marks',exact:true})).toBeVisible();await expect(marks).toHaveValue('95')
    expect(saved[0].marks[0].expected_revision).toBe(2)
    await page.getByRole('button',{name:'Reload latest marks',exact:true}).click();await page.getByRole('button',{name:'Discard and reload',exact:true}).click()
    await expect(marks).toHaveValue('80');await marks.fill('85');await page.getByRole('button',{name:'Save marks',exact:true}).click()
    await expect.poll(()=>saved.length).toBe(2);expect(saved[1].marks[0].expected_revision).toBe(3)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`promoted student can select historical report exam ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let sent
    await page.route('**/api/v1/documents/**',r=>{
      if(r.request().url().endsWith('/options'))return r.fulfill({json:{students:[{id:1,name:'Asha',class_name:'6',section:'A'}],exams:[{id:5,name:'Previous final',class_name:'5',section:'A',academic_year:'2025-26',student_ids:[1]}],templates:[]}})
      if(r.request().method()==='POST')sent=r.request().postDataJSON()
      return r.fulfill({json:{data:[],total:0}})
    })
    await page.goto('/e2e/student_support_harness.html?module=documents')
    await page.getByRole('combobox',{name:'Student',exact:true}).selectOption('1')
    await page.getByRole('combobox',{name:'Document type',exact:true}).selectOption('report_card')
    await page.getByRole('combobox',{name:'Published exam',exact:true}).selectOption('5')
    await page.getByRole('button',{name:'Issue document',exact:true}).click()
    await expect.poll(()=>sent?.exam_id).toBe(5);expect(sent.student_id).toBe(1)
  })
  test(`report retry keeps operation ID and shows recipient outcome ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let attempts=[],retried=false
    const schedule={id:1,report_key:'fees',export_format:'pdf',schedule_type:'daily',run_at:'09:00',timezone:'UTC',channels:['email'],email_recipients:['a@example.test','b@example.test'],is_active:true}
    await page.route('**/api/v1/reports/catalog',r=>r.fulfill({json:{reports:[{key:'fees',label:'Fees',filters:[]}]}}))
    await page.route('**/api/v1/scheduled-reports**',r=>{
      const p=new URL(r.request().url()).pathname
      if(p.endsWith('/run')){attempts.push(r.request().headers()['x-client-operation-id']);if(attempts.length===1)return r.abort('failed');return r.fulfill({json:{message:'Delivery processed'}})}
      if(p.endsWith('/retry')){retried=true;expect(r.request().headers()['x-client-operation-id']).toBeTruthy();return r.fulfill({json:{message:'Retried'}})}
      if(p.endsWith('/runs'))return r.fulfill({json:{data:[{id:7,status:retried?'completed':'partial',record_count:1,retryable_count:retried?0:1,delivery_results:[{recipient:'a@example.test',channel:'email',status:'sent',attempts:1},{recipient:'b@example.test',channel:'email',status:retried?'sent':'failed',attempts:retried?2:1}]}]}})
      return r.fulfill({json:{data:[schedule]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=schedules')
    for(let i=0;i<2;i++){await page.getByRole('button',{name:'Run now',exact:true}).click();await page.getByRole('button',{name:'Send report',exact:true}).click();await expect(page.getByRole('button',{name:'Run now',exact:true})).toBeEnabled()}
    await expect(page.getByText('email · b@example.test · failed · Attempts: 1')).toBeVisible();expect(attempts[0]).toBeTruthy();expect(attempts[0]).toBe(attempts[1])
    await page.getByRole('button',{name:'Retry failed recipients',exact:true}).click();await page.getByRole('button',{name:'Retry failed',exact:true}).click()
    await expect(page.getByText('email · b@example.test · sent · Attempts: 2')).toBeVisible()
  })
  test(`support overdue filter and completed review ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let saved,filter
    const row={id:1,student_id:1,student_name:'Asha',teacher_id:2,teacher_name:'Ms Singh',goal:'Private goal',review_date:'2026-10-01',status:'open',version:2,overdue_days:17,notes:[],reviews:[],flags:[],family_summary:''}
    await page.route('**/api/v1/exams/support/students?*',r=>r.fulfill({json:{total:1,data:[{id:1,student_name:'Asha',class_name:'5',section:'A',flags:[],teachers:[{id:2,full_name:'Ms Singh'}]}]}}))
    await page.route('**/api/v1/exams/support/cases**',r=>{if(r.request().method()==='PATCH')saved=r.request().postDataJSON();filter=new URL(r.request().url()).searchParams.get('review')||filter;return r.fulfill({json:{total:1,data:[row],review_summary:{overdue:1,due_today:0,upcoming:0,closed:0}}})})
    await page.goto('/e2e/student_support_harness.html?module=support')
    await page.getByRole('combobox',{name:'Review filter'}).selectOption('overdue');await expect.poll(()=>filter).toBe('overdue')
    await expect(page.getByText('Overdue by 17 days')).toBeVisible();await page.getByRole('button',{name:'Update follow-up'}).click()
    await page.getByLabel('Record completed review').check();await page.getByRole('combobox',{name:'Review outcome'}).selectOption('improving')
    await page.getByLabel('Follow-up note').fill('Reading has improved');await page.getByLabel('Review date',{exact:true}).fill('2026-12-01')
    await page.getByRole('button',{name:'Save support case'}).click();await expect.poll(()=>saved?.record_review).toBe(true)
    expect(saved.version).toBe(2);expect(saved.share_note).toBe(false);expect(saved.review_outcome).toBe('improving')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
