import { test, expect } from '@playwright/test'

const records = [
  {id:1,person_name:'Employee',person_type:'staff',status:'pending',leave_type:'casual',start_date:'2026-10-13',end_date:'2026-10-13',days:1,reason:'Appointment'},
  {id:2,person_name:'Student',person_type:'student',status:'informed',leave_type:'sick',start_date:'2026-10-13',end_date:'2026-10-13',days:1,reason:'Rest'},
]

test('School Admin can approve employee leave and only cancel a student notice',async({page})=>{
  await page.route('**/api/v1/leave/**',r=>{
    const path=new URL(r.request().url()).pathname
    return r.fulfill({json:path.endsWith('/requests')?{data:records,total:2}:path.endsWith('/options')?{people:[]}:{data:[]}})
  })
  await page.goto('/e2e/leave_harness.html')
  await page.getByRole('button',{name:'Open #2'}).click()
  await expect(page.getByRole('combobox',{name:/^Decision/})).toHaveValue('cancelled')
  await expect(page.getByRole('option',{name:'Approve',exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'Close',exact:true}).click()
  await page.getByRole('button',{name:'Open #1'}).click()
  await expect(page.getByRole('combobox',{name:/^Decision/})).toHaveValue('approved')
  await expect(page.getByRole('option',{name:'Approve',exact:true})).toHaveCount(1)
})

test('student form sends leave information with no approval language',async({page})=>{
  await page.addInitScript(() => sessionStorage.setItem('school_access_token', `header.${btoa(JSON.stringify({sub:'2',schema_context:'school_test'}))}.signature`))
  await page.route('**/api/v1/leave/**',r=>{
    const path=new URL(r.request().url()).pathname
    let json={data:[]}
    if(path.endsWith('/options')) json={people:[{person_type:'student',person_id:1,name:'Asha',status:'active'}]}
    if(path.endsWith('/requests')) json=r.request().method()==='POST'?{success:true,message:'Leave information sent. No approval required.',status:'informed'}:{data:[],total:0}
    return r.fulfill({json})
  })
  await page.goto('/e2e/leave_harness.html?role=Student')
  await page.getByLabel('Start date',{exact:true}).fill('2026-10-13'); await page.getByLabel('End date',{exact:true}).fill('2026-10-13')
  await page.getByLabel('Reason',{exact:true}).fill('Appointment')
  await page.getByRole('button',{name:'Send leave information',exact:true}).click()
  await expect(page.getByText('Leave information sent. No approval required.')).toBeVisible()
  await expect(page.getByRole('heading',{name:/leave balance/})).toHaveCount(0)
})
