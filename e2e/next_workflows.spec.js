import {test,expect} from '@playwright/test'
import { Buffer } from 'node:buffer'

test('parent starts a conversation using linked children, not staff student access',async({page})=>{
  let staffRequest=false,created=false
  await page.route('**/api/v1/**',r=>{
    const url=r.request().url()
    if(url.includes('/student/all')){staffRequest=true;return r.fulfill({status:403,json:{message:'Forbidden'}})}
    if(url.includes('/portal/me'))return r.fulfill({json:{children:[{id:1,first_name:'Ananya',class_name:'Grade 1',section:'A'}]}})
    if(url.includes('/messages/recipients'))return r.fulfill({json:{data:[{id:7,name:'Priya',role:'Teacher'}]}})
    if(r.request().method()==='POST'){const data=r.request().postDataJSON();expect(data.student_id).toBe(1);expect(data.recipient_user_id).toBe(7);expect(r.request().headers()['x-client-operation-id']).toBeTruthy();created=true;return r.fulfill({json:{thread_id:9}})}
    if(url.endsWith('/threads/9'))return r.fulfill({json:{data:{thread:{id:9,subject:'Progress'},messages:[]}}})
    return r.fulfill({json:{data:[]}})
  })
  await page.goto('/e2e/next_workflows_harness.html?module=messages&role=Parent')
  await page.getByRole('combobox',{name:'Student',exact:true}).selectOption('1');await page.getByLabel('Recipient').selectOption('7');await page.getByLabel('Subject').fill('Progress');await page.getByLabel('Message',{exact:true}).fill('Please share an update');await page.getByRole('button',{name:'Start conversation'}).click();await expect(page.getByRole('heading',{name:'Progress'})).toBeVisible();expect(created).toBe(true);expect(staffRequest).toBe(false)
})

for(const width of [390,1440]) {
  test(`attendance corrections request and review at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let rows=[]
    await page.route('**/api/v1/attendance/**',async route=>{
      const req=route.request(),url=req.url()
      if(url.includes('correction-records'))return route.fulfill({json:{data:[{id:1,student_name:'Ananya',class_name:'Grade 1',section:'A',status:'absent'}]}})
      if(req.method()==='POST'&&url.endsWith('/review')){expect(req.postDataJSON()).toEqual({status:'approved',review_notes:'Checked register'});rows[0].status='approved';return route.fulfill({json:{success:true}})}
      if(req.method()==='POST'){const b=req.postDataJSON();expect(b.status).toBe('present');rows=[{id:1,student_name:'Ananya',attendance_date:'2026-10-17',class_name:'Grade 1',section:'A',original:{status:'absent'},proposed:{status:b.status},reason:b.reason,status:'pending'}];return route.fulfill({json:{success:true}})}
      return route.fulfill({json:{data:rows}})
    })
    await page.goto('/e2e/next_workflows_harness.html?module=attendance&admin=true')
    await page.getByRole('button',{name:'Find attendance records'}).click();await page.getByLabel('Recorded attendance').selectOption('1');await page.getByLabel('Correct status').selectOption('present');await page.getByLabel('Reason',{exact:true}).fill('Wrong register entry');await page.getByRole('button',{name:'Request correction'}).click();await page.getByLabel('Review notes').fill('Checked register');await page.getByRole('button',{name:'Approve correction'}).click();await expect(page.getByText('Grade 1 A: absent → present · approved')).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`staff payslip details and salary question at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let questions=[]
    await page.route('**/api/v1/payroll/**',r=>{if(r.request().url().endsWith('/mine'))return r.fulfill({json:{data:[{id:1,payroll_month:'2026-10-01',full_name:'Priya',basic_salary:'30000',allowances:'2000',deductions:'500',attendance_deduction:'0',net_salary:'31500'}]}});if(r.request().method()==='POST'){const b=r.request().postDataJSON();expect(b.payslip_id).toBe(1);questions=[{id:1,payroll_month:'2026-10-01',full_name:'Priya',question:b.question}];return r.fulfill({json:{success:true}})}return r.fulfill({json:{data:questions}})})
    await page.goto('/e2e/next_workflows_harness.html?module=payslips');await expect(page.getByText('Net salary ₹31500')).toBeVisible();await page.getByLabel('Payslip',{exact:true}).selectOption('1');await page.getByLabel('Salary question').fill('Explain deduction');await page.getByRole('button',{name:'Send to School Admin'}).click();await expect(page.getByText('Awaiting Admin response')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
  test(`messages attach PDF and reuse retry ID at ${width}`,async({page})=>{
    await page.setViewportSize({width,height:900});let attempts=[],sent=false
    await page.route('**/api/v1/**',r=>{
      const u=r.request().url(),method=r.request().method()
      if(u.includes('/student/all'))return r.fulfill({json:{data:[]}})
      if(u.endsWith('/documents/files'))return r.fulfill({json:{file:{id:8,original_filename:'note.pdf'}}})
      if(u.endsWith('/read'))return r.fulfill({json:{success:true}})
      if(u.endsWith('/messages')&&method==='POST'){attempts.push(r.request().headers()['x-client-operation-id']);expect(r.request().postDataJSON().attachment_file_id).toBe(8);if(attempts.length===1)return r.abort();sent=true;return r.fulfill({json:{success:true}})}
      if(u.endsWith('/threads/1'))return r.fulfill({json:{data:{thread:{id:1,subject:'School progress'},messages:[{id:1,sender_user_id:4,sender_name:'Teacher',body:sent?'Updated note':'Earlier note',read_by_recipient:true,created_at:'2026-10-17T10:00:00Z'}]}}})
      return r.fulfill({json:{data:[{id:1,subject:'School progress',student_name:'Ananya',unread_count:0}]}})
    })
    await page.goto('/e2e/next_workflows_harness.html?module=messages');await page.getByRole('button',{name:/School progress/}).click();await page.getByLabel('Reply',{exact:true}).fill('Updated note');await page.getByLabel('Attach photo or PDF').setInputFiles({name:'note.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 test')});await expect(page.getByRole('button',{name:'Remove attachment'})).toBeVisible();await page.getByRole('button',{name:'Send reply'}).click();await expect(page.getByRole('alert')).toContainText('retained');await page.getByRole('button',{name:'Send reply'}).click();await expect(page.getByText('Updated note',{exact:true})).toBeVisible();expect(attempts).toHaveLength(2);expect(attempts[0]).toBeTruthy();expect(attempts[0]).toBe(attempts[1]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
