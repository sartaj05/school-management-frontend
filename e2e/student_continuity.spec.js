import {test,expect} from '@playwright/test'

for(const width of [390,1440]){
  test(`unsaved marks stay discard save and navigation ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});const writes=[]
    await page.route('**/api/v1/**',r=>{
      const p=new URL(r.request().url()).pathname
      if(p.endsWith('/options'))return r.fulfill({json:{classes:[],subjects:[{id:1,name:'Math',code:'M'},{id:2,name:'Art',code:'A'}]}})
      if(p.endsWith('/students'))return r.fulfill({json:{data:[{student_id:1,student_name:'Asha',revision:1,max_marks:100,marks_obtained:70,result_status:'graded'}]}})
      if(p.endsWith('/marks')){writes.push(r.request().postDataJSON());return r.fulfill({json:{message:'Saved'}})}
      if(p.endsWith('/readiness'))return r.fulfill({json:{subjects:[],available_subjects:[],missing:[]}})
      if(p.includes('/corrections'))return r.fulfill({json:{data:[],total:0}})
      return r.fulfill({json:{data:[{id:1,name:'Term 1',class_name:'5',section:'A',academic_year:'2026-27',status:'draft'}]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=exams&role=Teacher')
    const subject=page.getByRole('combobox',{name:'Subject',exact:true})
    await page.getByRole('combobox',{name:'Exam',exact:true}).selectOption('1');await subject.selectOption('1');await page.getByRole('button',{name:'Load marks',exact:true}).click()
    const mark=page.locator('tbody input[type=number]').nth(1);await mark.fill('91');await subject.selectOption('2')
    await page.getByRole('button',{name:'Stay',exact:true}).click();await expect(subject).toHaveValue('1');await expect(mark).toHaveValue('91')
    await subject.selectOption('2');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(subject).toHaveValue('2');expect(writes[0].subject_id).toBe(1);expect(writes[0].marks[0].marks_obtained).toBe(91)
    await page.getByRole('button',{name:'Load marks',exact:true}).click();await mark.fill('81')
    await page.getByRole('link',{name:'Leave workspace'}).click();await page.getByRole('button',{name:'Stay',exact:true}).click();await expect(mark).toHaveValue('81')
    await page.getByRole('link',{name:'Leave workspace'}).click();await page.getByRole('button',{name:'Discard',exact:true}).click();await expect(page.getByText('Destination workspace')).toBeVisible();expect(writes).toHaveLength(1)
  })
  test(`unknown delivery requires provider evidence ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let resolved
    await page.route('**/api/v1/**',r=>{
      const p=new URL(r.request().url()).pathname
      if(p.endsWith('/catalog'))return r.fulfill({json:{reports:[{key:'fees',filters:[]}]}})
      if(p.endsWith('/resolve')){resolved=r.request().postDataJSON();return r.fulfill({json:{message:'Reviewed'}})}
      if(p.endsWith('/runs'))return r.fulfill({json:{data:[{id:7,status:'partial',uncertain_count:resolved?0:1,delivery_results:[{channel:'email',recipient:'school@example.test',status:resolved?'sent':'unknown',attempts:1}]}]}})
      return r.fulfill({json:{data:[{id:1,report_key:'fees',is_active:true,channels:['email'],email_recipients:['school@example.test']} ]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=schedules');await page.getByRole('button',{name:'Runs',exact:true}).click()
    await page.getByRole('button',{name:'Review unknown delivery'}).click();await page.getByLabel('Provider evidence').fill('Provider ticket ABC confirms receipt')
    await page.getByRole('button',{name:'Record provider confirmation'}).click();expect(resolved).toBeUndefined();await page.getByRole('button',{name:'Confirm outcome'}).click()
    await expect.poll(()=>resolved?.outcome).toBe('delivered');expect(resolved.expected_attempts).toBe(1)
    await expect(page.getByRole('button',{name:'Review unknown delivery'})).toHaveCount(0)
  })
  test(`promotion includes versioned support handover ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let saved
    const options={students:[{id:1,student_name:'Asha',admission_no:'A1',class_name:'5',section:'A'}],classes:[{id:2,class_name:'6',section:'A'}]}
    await page.route('**/api/v1/academic-years/**',r=>{
      if(r.request().method()==='GET')return r.fulfill({json:options})
      if(r.request().url().endsWith('/promote')){saved=r.request().postDataJSON();return r.fulfill({json:{promoted:1}})}
      return r.fulfill({json:{data:[{student_id:1,student_name:'Asha',from_class:'5',from_section:'A',next_class_name:'6',next_section:'A',status:'active'}],capacities:[],support_cases:[{case_id:8,version:3,student_name:'Asha',goal:'Reading plan',review_date:'2027-01-01',teachers:[{id:2,full_name:'Ms Singh'}]}]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=promotion')
    await page.getByRole('combobox',{name:'From year'}).selectOption('2025');await page.getByRole('combobox',{name:'To year'}).selectOption('2026');await page.getByRole('combobox',{name:'Destination class',exact:true}).selectOption('2');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Preview promotion'}).click()
    await expect(page.getByRole('button',{name:'Confirm promotion'})).toBeDisabled();await page.getByRole('combobox',{name:'Destination teacher'}).selectOption('2');await page.getByLabel('Private handover note').fill('Continue reading support')
    await page.getByRole('button',{name:'Confirm promotion'}).click();await expect.poll(()=>saved?.support_handovers?.length).toBe(1);expect(saved.support_handovers[0]).toMatchObject({case_id:8,version:3,teacher_id:2,action:'transfer'})
  })
  test(`progress year filter and PDF use selected student ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let year
    await page.route('**/api/v1/exams/progress**',r=>{
      const u=new URL(r.request().url());if(u.pathname.endsWith('/students'))return r.fulfill({json:{data:[{id:1,name:'Asha',class_name:'6',section:'A'}],years:[{year_label:'2026-27'}],total:1}})
      year=u.searchParams.get('academic_year');return r.fulfill({json:{student:{id:1,name:'Asha',class_name:'6',section:'A'},academic_year:year||'All years',summary:{published_exams:1,attendance_percentage:90,submitted:7,assignments:8},exams:[{id:2,name:'Final',academic_year:'2026-27',class_name:'5',term:'Term 2',percentage:80}],timeline:[{date:'2026-10-01',type:'Shared support update',description:'Reading improved'}]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=progress');await page.getByRole('button',{name:'Asha · 6 A'}).click();await expect(page.getByText('Reading improved')).toBeVisible();await expect(page.getByText('80%',{exact:true})).toBeVisible()
    await page.getByRole('combobox',{name:'Academic year'}).selectOption('2026-27');await expect.poll(()=>year).toBe('2026-27');await expect(page.getByRole('button',{name:'Download progress PDF'})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
