import {test,expect} from '@playwright/test'
for(const width of [390,1440]){
  test(`mark crash recovery compares revisions before saving ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900})
    await page.addInitScript(()=>sessionStorage.setItem('school_access_token',`a.${btoa(JSON.stringify({schema_context:'school_test',sub:'1'}))}.c`))
    let revision=1,written
    await page.route('**/api/v1/**',r=>{
      const p=new URL(r.request().url()).pathname
      if(p.endsWith('/options'))return r.fulfill({json:{classes:[],subjects:[{id:1,name:'Math',code:'M'}]}})
      if(p.endsWith('/students'))return r.fulfill({json:{data:[{student_id:1,student_name:'Asha',revision,marks_obtained:70,max_marks:100,result_status:'graded'}]}})
      if(p.endsWith('/marks')){written=r.request().postDataJSON();return r.fulfill({json:{message:'Saved'}})}
      if(p.endsWith('/readiness'))return r.fulfill({json:{subjects:[],available_subjects:[],missing:[]}})
      if(p.includes('corrections'))return r.fulfill({json:{data:[],total:0}})
      return r.fulfill({json:{data:[{id:1,name:'Term 1',status:'draft',class_name:'5',academic_year:'2026'}]}})
    })
    const load=async()=>{await page.getByRole('combobox',{name:'Exam',exact:true}).selectOption('1');await page.getByRole('combobox',{name:'Subject',exact:true}).selectOption('1');await page.getByRole('button',{name:'Load marks',exact:true}).click()}
    await page.goto('/e2e/student_support_harness.html?module=exams&role=Teacher');await load()
    await page.locator('tbody input[type=number]').nth(1).fill('92')
    revision=2
    await page.reload();await load()
    await expect(page.getByText('Recover unsaved marks',{exact:true})).toBeVisible()
    await page.getByRole('button',{name:'Restore reviewed draft'}).click()
    await expect(page.getByText('Review changed marks before restoring',{exact:true})).toBeVisible()
    await page.getByRole('button',{name:'Use reviewed draft'}).click()
    await expect(page.locator('tbody input[type=number]').nth(1)).toHaveValue('92')
    await page.getByRole('button',{name:'Save marks',exact:true}).click()
    await expect.poll(()=>written?.marks[0].expected_revision).toBe(2);expect(written.marks[0].marks_obtained).toBe(92)
    expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('school-mark-draft:')).length)).toBe(0)
  })
  test(`roster changes require preview evidence and protect submissions ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let applied
    await page.route('**/api/v1/**',r=>{
      if(r.request().url().endsWith('/preview'))return r.fulfill({json:{preview:{add:[{id:2,name:'Meera'}],remove:[],evidence:'Original register checked'}}})
      if(r.request().url().endsWith('/apply')){applied=r.request().postDataJSON();return r.fulfill({json:{success:true}})}
      return r.fulfill({json:{title:'Reading',revision:4,editable:true,total:1,members:[{student_id:1,student_snapshot:{name:'Asha'},has_submission:true}],candidates:[{id:2,name:'Meera',admission_no:'S2',class_name:'5'}],history:[]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=roster')
    await expect(page.getByRole('checkbox',{name:/Remove Asha/})).toBeDisabled()
    await page.getByRole('checkbox',{name:/Add Meera/}).check();await page.getByLabel('Historical evidence').fill('Original register checked')
    await page.getByRole('button',{name:'Preview roster changes'}).click()
    await page.getByRole('button',{name:'Apply reviewed changes'}).click();expect(applied).toBeUndefined()
    await page.getByRole('button',{name:'Apply review',exact:true}).click()
    await expect.poll(()=>applied?.expected_revision).toBe(4);expect(applied.add_ids).toEqual([2])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
  })
  test(`waitlist offer and acceptance carry current version ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let state='waitlisted',version=1;const writes=[]
    await page.route('**/api/v1/**',r=>{
      if(r.request().method()==='POST'){const body=r.request().postDataJSON();writes.push(body);state=body.action==='offer'?'offered':'accepted';version++;return r.fulfill({json:{success:true}})}
      return r.fulfill({json:{data:[{id:1,name:'Asha',application_no:'ADM-1',applying_class:'5',section:'A',seat_status:state,version}],history:[],total:1}})
    })
    await page.goto('/e2e/student_support_harness.html?module=waitlist')
    await page.getByRole('button',{name:'Manage seat'}).click();await page.getByLabel('Confirmation / reason').fill('Family contacted for admission')
    await page.getByRole('button',{name:'Offer seat',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click()
    await expect.poll(()=>writes.length).toBe(1);expect(writes[0].expected_version).toBe(1)
    await page.getByRole('button',{name:'Manage seat'}).click();await page.getByLabel('Confirmation / reason').fill('Family accepted by phone')
    await page.getByRole('button',{name:'Record family acceptance'}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click()
    await expect.poll(()=>writes.length).toBe(2);expect(writes[1].expected_version).toBe(2)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
  })
  test(`homework stale grading keeps edits until confirmed reload ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let revision=2,written
    await page.route('**/api/v1/**',r=>{
      const p=new URL(r.request().url()).pathname
      if(p.endsWith('/options'))return r.fulfill({json:{classes:[],subjects:[]}})
      if(p.endsWith('/history'))return r.fulfill({json:{data:[]}})
      if(p.endsWith('/students'))return r.fulfill({json:{data:[{student_id:1,student_name:'Asha',submission_id:1,revision,score:revision===2?70:85,feedback:'Saved'}]}})
      if(p.endsWith('/grade')){written=r.request().postDataJSON();revision=3;return r.fulfill({status:409,json:{message:'Revision changed'}})}
      return r.fulfill({json:{data:[{id:1,title:'Reading',status:'published',max_score:100}]}})
    })
    await page.goto('/e2e/student_support_harness.html?module=assignments')
    await page.getByRole('button',{name:'Students',exact:true}).click()
    const score=page.getByLabel('Score / 100');await score.fill('90');await page.getByRole('button',{name:'Grade',exact:true}).click()
    await expect(page.getByRole('button',{name:'Reload latest homework'})).toBeVisible();await expect(score).toHaveValue('90');expect(written.expected_revision).toBe(2)
    await page.getByRole('button',{name:'Reload latest homework'}).click();await page.getByRole('button',{name:'Reload',exact:true}).click()
    await expect(score).toHaveValue('85')
  })
}
