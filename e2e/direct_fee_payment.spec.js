import { expect, test } from '@playwright/test'

async function setup(context, { staff = true, settings = {}, inject = true } = {}) {
  if (inject) await context.addInitScript(({staff}) => {
    sessionStorage.setItem('school_access_token','test-only-token')
    sessionStorage.setItem('school_session',JSON.stringify({user:{id:1,role:staff?'School Admin':'Parent'}}))
  }, {staff})
  await context.route('**/api/v1/fees/invoices/*/payment-options', r => r.fulfill({json:{success:true,data:[{id:1,fee_name:'College fee',available_amount:1000},{id:2,fee_name:'Exam fee',available_amount:200}],settings,can_record_cash:staff}}))
}

for (const width of [390, 1440]) {
  test(`cash payment steps, amount validation and layout at ${width}px`, async ({page,context}) => {
    await setup(context); await page.setViewportSize({width,height:900})
    let submitted
    await context.route('**/api/v1/fees/invoices/*/direct-payment',async r => { submitted=r.request().postDataJSON(); await r.fulfill({json:{success:true,status:'partial',message:'Cash payment recorded.'}}) })
    await page.goto('/fee-payment?invoice=1')
    await page.getByLabel('Fee type').selectOption('2')
    await page.getByLabel('Enter amount').fill('201')
    await page.getByRole('button',{name:'Next: payment method'}).click()
    await expect(page.getByRole('heading',{name:'Choose your fee'})).toBeVisible()
    await page.getByLabel('Enter amount').fill('125.50')
    await page.getByRole('button',{name:'Next: payment method'}).click()
    await expect(page.getByRole('heading',{name:'Choose how to pay'})).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({path:`local-test-results/fee-payment-${width}.png`,fullPage:true})
    await page.getByRole('button',{name:'Confirm cash received'}).click()
    await expect(page.getByRole('heading',{name:'Cash payment recorded'})).toBeVisible()
    expect(submitted.amount).toBe(125.5); expect(submitted.payment_method).toBe('cash'); expect(submitted.request_key).toBeTruthy()
  })
}

test('family cash remains pending and unconfigured UPI is blocked',async ({page,context})=>{
  await setup(context,{staff:false})
  await context.route('**/direct-payment',r=>r.fulfill({json:{success:true,status:'pending',message:'Submitted for School Admin verification.'}}))
  await page.goto('/fee-payment?invoice=1'); await page.getByRole('button',{name:'Next: payment method'}).click()
  await page.getByLabel('Payment method').selectOption('upi')
  await expect(page.getByText(/School Admin has not added UPI/)).toBeVisible()
  await expect(page.getByRole('button',{name:'Submit for verification'})).toBeDisabled()
  await page.getByLabel('Payment method').selectOption('cash')
  await page.getByRole('button',{name:'Submit for verification'}).click()
  await expect(page.getByRole('heading',{name:'Awaiting school verification'})).toBeVisible()
})

test('bank opens configured website and requires transfer reference',async ({page,context})=>{
  await setup(context,{staff:false,settings:{bank_name:'Test Bank',account_holder:'School',account_number:'1234567890',ifsc:'TEST0000001',bank_url:'https://bank.example.test/'}})
  await context.route('https://bank.example.test/',r=>r.fulfill({body:'Test bank destination'}))
  let calls=0
  await context.route('**/direct-payment',r=>{calls++;return r.fulfill({json:{success:true,status:'pending',message:'Submitted for School Admin verification.'}})})
  await page.goto('/fee-payment?invoice=1'); await page.getByRole('button',{name:'Next: payment method'}).click()
  const opened=context.waitForEvent('page'); await page.getByLabel('Payment method').selectOption('bank_transfer')
  const bank=await opened; await bank.waitForURL('https://bank.example.test/'); await bank.close()
  await page.getByRole('button',{name:'Submit for verification'}).click(); expect(calls).toBe(0)
  await page.getByLabel('Transaction reference / UTR').fill('UTR123456')
  await page.getByRole('button',{name:'Submit for verification'}).click()
  await expect(page.getByRole('heading',{name:'Awaiting school verification'})).toBeVisible(); expect(calls).toBe(1)
})

test('payment opens in a new tab with isolated same-origin session',async ({page,context})=>{
  await setup(context,{inject:false}); await page.goto('/')
  await page.evaluate(()=>{ sessionStorage.setItem('school_access_token','test-only-token');sessionStorage.setItem('school_session',JSON.stringify({user:{id:1,role:'School Admin'}})) })
  await page.goto('/fee-payment?invoice=1')
  const opened=context.waitForEvent('page')
  await page.evaluate(async()=>{ const {openFeePayment}=await import('/src/lib/feePayment.js'); openFeePayment(2) })
  const tab=await opened; await tab.waitForURL('**/fee-payment?invoice=2')
  await expect(tab.getByRole('heading',{name:'Choose your fee'})).toBeVisible()
  expect(await tab.evaluate(()=>window.opener)).toBeNull()
  expect(tab.url()).not.toContain('token'); await tab.close()
})
