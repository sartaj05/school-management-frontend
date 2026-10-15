import { Buffer } from 'node:buffer'
import { test, expect } from '@playwright/test'

async function fees(context) {
  await context.addInitScript(()=>{sessionStorage.setItem('school_access_token','test-token');sessionStorage.setItem('school_session',JSON.stringify({user:{id:1,role:'School Admin'}}))})
  await context.route('**/api/v1/fees/invoices/*/payment-options',r=>r.fulfill({json:{data:[{id:1,fee_name:'College fee',available_amount:1000}],settings:{upi_id:'school@bank',payee_name:'School'},can_record_cash:true}}))
  await context.route('**/api/v1/fees/invoices/*/payment-status',r=>r.fulfill({json:{data:[{id:8,amount:100,status:'rejected',payment_method:'upi',reference_number:'UTR1234',review_notes:'Reference does not match',timeline:[{status:'submitted',at:'2026-10-13T10:00:00Z'},{status:'under_verification',at:'2026-10-13T11:00:00Z'},{status:'rejected',at:'2026-10-13T12:00:00Z'}]}],recorded_payments:[],balance:1000}}))
  await context.route('**/api/v1/fees/invoices/*/installments',r=>r.fulfill({json:{data:[],can_edit:false}}))
}

test('proof attachment and school QR are included in the payment flow',async({page,context})=>{
  await fees(context)
  await context.route('**/api/v1/documents/files',r=>r.fulfill({json:{file:{id:44,original_filename:'bank-proof.png'}}}))
  await context.route('**/upi-qr?amount=*',r=>r.fulfill({json:{qr_image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=',payee_name:'School',amount:1000}}))
  let payload
  await context.route('**/direct-payment',r=>{payload=r.request().postDataJSON();return r.fulfill({json:{status:'pending',message:'Submitted for verification'}})})
  await page.goto('/fee-payment?invoice=1')
  await expect(page.getByText('School note: Reference does not match')).toBeVisible()
  await page.getByRole('button',{name:'Next: payment method'}).click()
  await page.getByLabel('Payment method').selectOption('upi')
  await expect(page.getByRole('img')).toBeVisible()
  await page.getByLabel('Payment proof').setInputFiles({name:'bank-proof.png',mimeType:'image/png',buffer:Buffer.from('test image')})
  await expect(page.getByText('Attached: bank-proof.png')).toBeVisible()
  await page.getByLabel('Transaction reference / UTR').fill('UTR-TEST-1234')
  await page.getByRole('button',{name:'Submit for verification'}).click()
  await expect(page.getByRole('heading',{name:'Awaiting school verification'})).toBeVisible()
  expect(payload.proof_file_id).toBe(44)
})

test('monthly installment draft is editable and saved on mobile',async({page,context})=>{
  await fees(context);await page.setViewportSize({width:390,height:900})
  let saved
  const draft=[{label:'Term 1',due_date:'2026-11-01',amount:500},{label:'Term 2',due_date:'2026-12-01',amount:500}]
  await context.route('**/api/v1/fees/invoices/*/installments',r=>{
    const method=r.request().method();if(method==='PUT')saved=r.request().postDataJSON()
    return r.fulfill({json:method==='POST'?{data:draft}:{data:saved?saved.installments.map((x,i)=>({...x,id:i,paid:0,remaining:x.amount,status:'upcoming'})):[],can_edit:true,total:1000}})
  })
  await page.goto('/fee-payment?invoice=1')
  await page.getByText('Create or edit schedule',{exact:true}).click()
  await page.getByLabel('Number of installments').fill('2')
  await page.getByLabel('First due date').fill('2026-11-01')
  await page.getByRole('button',{name:'Generate draft'}).click()
  await page.getByLabel('Label',{exact:true}).first().fill('First term')
  await page.getByRole('button',{name:'Save installment schedule'}).click()
  await expect(page.getByText('First term · upcoming')).toBeVisible()
  expect(saved.installments[0].label).toBe('First term')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

test('settled invoice tracking never silently switches to another unpaid fee',async({page,context})=>{
  await fees(context)
  await page.goto('/fee-payment?invoice=8')
  await expect(page.getByLabel('Fee type')).toHaveValue('8')
  await expect(page.getByRole('button',{name:'Next: payment method'})).toBeDisabled()
  await expect(page.getByText('School note: Reference does not match')).toBeVisible()
})

test('student notice shows delivered and read recipients without approval',async({page})=>{
  await page.route('**/api/v1/leave/**',r=>{
    const path=new URL(r.request().url()).pathname
    return r.fulfill({json:path.endsWith('/requests')?{data:[{id:2,person_name:'Student',person_type:'student',status:'informed',reason:'Appointment'}],total:1}:path.endsWith('/notifications')?{message:'No approval is required.',data:[{id:1,recipient:'Parent',role:'Parent',event:'informed',status:'read',delivered_at:'2026-10-13T10:00:00Z',read_at:'2026-10-13T11:00:00Z'},{id:2,recipient:'Teacher',role:'Teacher',event:'informed',status:'delivered'}],missing_roles:[]}:path.endsWith('/options')?{people:[]}:{data:[]}})
  })
  await page.goto('/e2e/leave_harness.html');await page.getByRole('button',{name:'Open #2'}).click()
  await expect(page.getByRole('heading',{name:'Leave notification tracking'})).toBeVisible()
  await expect(page.getByText('informed · read')).toBeVisible()
  await expect(page.getByText('informed · delivered')).toBeVisible()
  await expect(page.getByRole('option',{name:'Approve',exact:true})).toHaveCount(0)
})

test('admin assigns and removes a substitute for an affected class',async({page})=>{
  let assigned=false
  await page.route('**/api/v1/leave/**',r=>{
    const path=new URL(r.request().url()).pathname
    if(r.request().method()==='POST'){expect(r.request().postDataJSON().substitute_teacher_id).toBe(3);assigned=true}
    if(r.request().method()==='DELETE')assigned=false
    let json={data:[]}
    if(path.endsWith('/requests'))json={data:[{id:1,person_name:'Teacher',person_type:'staff',status:'approved',reason:'Leave'}],total:1}
    if(path.endsWith('/options'))json={people:[]}
    if(path.endsWith('/requests/1/substitutions'))json={can_edit:true,teachers:[{id:3,full_name:'Meera Singh'}],data:[{period_id:4,lesson_date:'2026-10-19',class_name:'10',section:'A',subject_name:'Maths',start_time:'09:00',end_time:'10:00',cover_id:assigned?9:null,substitute_name:assigned?'Meera Singh':null}]}
    return r.fulfill({json})
  })
  await page.goto('/e2e/leave_harness.html');await page.getByRole('button',{name:'Open #1'}).click()
  await page.getByLabel('Substitute teacher',{exact:true}).selectOption('3')
  await page.getByRole('button',{name:'Assign substitute'}).click()
  await expect(page.getByText('Substitute: Meera Singh')).toBeVisible()
  await page.getByRole('button',{name:'Remove cover'}).click()
  await expect(page.getByText('Substitute: Not assigned')).toBeVisible()
})
