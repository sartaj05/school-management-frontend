import {test,expect} from '@playwright/test'

for(const width of [390,1440]) {
  test(`exam subjects and completeness at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let saved
    await page.route('**/api/v1/exams/1/readiness',r=>{
      if(r.request().method()==='PUT')saved=r.request().postDataJSON().subject_ids
      return r.fulfill({json:{ready:false,subjects_configured:!!saved,subjects:saved?[{id:1,name:'Math'}]:[],available_subjects:[{id:1,name:'Math'},{id:2,name:'Art'}],student_count:35,expected_count:saved?35:0,missing_count:saved?35:0,missing:saved?[{student_id:1,student_name:'Asha',subject_id:1,subject_name:'Math'}]:[]}})
    })
    await page.goto('/e2e/reliability_harness.html?module=exam')
    await page.getByLabel('Math',{exact:true}).check();await page.getByRole('button',{name:'Save expected subjects'}).click()
    await expect(page.getByText('Asha — Math')).toBeVisible();expect(saved).toEqual([1])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`document archive pagination and filters at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});const requests=[]
    await page.route('**/api/v1/documents/issued?*',r=>{
      const q=new URL(r.request().url()).searchParams;requests.push(Object.fromEntries(q))
      return r.fulfill({json:{total:105,data:[{token:'a'.repeat(48),title:q.get('page')==='2'?'Older certificate':'Latest certificate',student_name:'Asha',status:'valid',issued_at:'2026-10-18'}]}})
    })
    await page.goto('/e2e/reliability_harness.html?module=archive')
    await page.getByRole('button',{name:'Next documents'}).click();await expect(page.getByText('Older certificate')).toBeVisible()
    await page.getByLabel('Class',{exact:true}).fill('Grade 5')
    await expect.poll(()=>requests.at(-1)?.class_name).toBe('Grade 5');expect(requests.at(-1).page).toBe('1')
    await page.getByRole('combobox',{name:'Status',exact:true}).selectOption('revoked');await expect.poll(()=>requests.at(-1)?.status).toBe('revoked')
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`task health cancellation and exact task selection at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let cancelled=false,selected
    await page.route('**/api/v1/documents/issued/batches**',r=>{
      const u=new URL(r.request().url())
      if(u.pathname.endsWith('/cancel')){cancelled=true;return r.fulfill({json:{cancelled:2}})}
      if(u.pathname.endsWith('/abc'))return r.fulfill({json:{data:[]}})
      selected=u.searchParams.get('batch_id')
      return r.fulfill({json:{worker:{status:'offline',message:'No heartbeat for 5 minutes.'},total:1,data:[{id:'abc',payload:{class_name:'Grade 1',section:'A',document_type:'certificate'},total:3,completed:1,pending:cancelled?0:2,failed:0,cancelled:cancelled?2:0,cancelled_at:cancelled?'2026-10-18':null,stalled:!cancelled}]}})
    })
    await page.goto('/e2e/reliability_harness.html?module=tasks')
    await expect(page.getByText('Worker: offline',{exact:false})).toBeVisible();expect(selected).toBe('abc')
    await page.getByRole('button',{name:'Cancel pending work'}).click();await page.getByRole('button',{name:'Cancel pending work'}).last().click()
    await expect(page.getByRole('button',{name:'Cancel pending work'})).toHaveCount(0);expect(cancelled).toBe(true)
    await expect(page.getByRole('button',{name:'Download ZIP'})).toBeEnabled()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
