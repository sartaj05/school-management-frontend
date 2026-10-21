import {Buffer} from 'node:buffer'
import {test,expect} from '@playwright/test'

const student={id:1,student_name:'Aarav Sharma',first_name:'Aarav',last_name:'Sharma',class_name:'Grade 5',section:'A',admission_no:'S1'}
const due={invoice_id:1,installment_id:2,student_name:student.student_name,class_name:'Grade 5',section:'A',fee_name:'Tuition',label:'Term 1',due_date:'2026-10-15',collectible:100,pending:200,status:'upcoming'}
for(const width of [390,1440]) {
  test.describe(`school operations at ${width}px`,()=>{
    test.beforeEach(async({page})=>{await page.setViewportSize({width,height:900})})
    test.afterEach(async({page})=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)})
    test('dues excludes pending amounts and confirms portal reminders',async({page})=>{
      let sent=0
      await page.route('**/api/v1/fees/dues?days=*',r=>{if(r.request().method()==='POST')sent++;return r.fulfill({json:{data:[due],message:'1 portal reminder sent.',missing_parent_links:0}})})
      await page.goto('/e2e/school_operations_harness.html?module=dues')
      await expect(page.getByText('INR 100.00',{exact:true})).toBeVisible()
      await expect(page.getByText('INR 200.00',{exact:true})).toBeVisible()
      await page.getByRole('button',{name:'Send parent reminders'}).click()
      await page.getByRole('button',{name:'Send reminders',exact:true}).click()
      await expect(page.getByRole('status')).toContainText('1 portal reminder sent')
      expect(sent).toBe(1)
    })
    test('bank CSV import suggests and confirms an existing payment',async({page})=>{
      let imported=false,matched=false
      await page.route('**/api/v1/fees/bank-statement',r=>{if(r.request().method()==='POST'){expect(r.request().postData()).toContain('UTR123');imported=true}return r.fulfill({json:{data:imported?[{id:1,reference:'UTR123',amount:100,date:'2026-10-14',status:matched?'matched':'suggested',payment_id:matched?7:null,candidates:matched?[]:[{id:7,student_name:'Aarav Sharma'}]}]:[],message:'1 new statement row imported.'}})})
      await page.route('**/bank-statement/1/confirm',r=>{expect(r.request().postDataJSON().payment_id).toBe(7);matched=true;return r.fulfill({json:{message:'Bank credit matched.'}})})
      await page.goto('/e2e/school_operations_harness.html?module=bank')
      await page.getByLabel('Upload bank credits').setInputFiles({name:'credits.csv',mimeType:'text/csv',buffer:Buffer.from('reference,amount,date\nUTR123,100,2026-10-14\n')})
      await page.getByRole('button',{name:'Confirm match',exact:true}).click()
      await page.getByRole('alertdialog').getByRole('button',{name:'Confirm match'}).click()
      await expect(page.getByText('Payment #7',{exact:true})).toBeVisible()
    })
    test('payment correction requires review notes and approval',async({page})=>{
      let submitted,approved=false
      await page.route('**/api/v1/fees/adjustments',r=>{if(r.request().method()==='POST')submitted=r.request().postDataJSON();return r.fulfill({json:{payments:[{id:7,student_name:'Aarav Sharma',available:300}],data:submitted?[{...submitted,id:1,status:approved?'approved':'pending',student_name:'Aarav Sharma'}]:[],message:'Adjustment submitted for School Admin approval.'}})})
      await page.route('**/adjustments/1/review',r=>{expect(r.request().postDataJSON()).toEqual({status:'approved',notes:'Duplicate checked'});approved=true;return r.fulfill({json:{message:'Adjustment approved.'}})})
      await page.goto('/e2e/school_operations_harness.html?module=adjustments')
      await page.getByLabel('Payment',{exact:true}).selectOption('7')
      await page.getByLabel('Amount',{exact:true}).fill('100')
      await page.getByLabel('Reason',{exact:true}).fill('Wrong amount')
      await page.getByRole('button',{name:'Submit for approval'}).click()
      await expect(page.getByRole('button',{name:'Approve',exact:true})).toBeDisabled()
      await page.getByLabel('Review notes 1').fill('Duplicate checked')
      await page.getByRole('button',{name:'Approve',exact:true}).click()
      await page.getByRole('alertdialog').getByRole('button',{name:'Confirm',exact:true}).click()
      await expect(page.getByRole('status')).toHaveText('Adjustment approved.')
      expect(submitted.payment_id).toBe(7)
    })
    test('family cards select the correct child and module',async({page})=>{
      await page.route('**/portal/children-dashboard',r=>r.fulfill({json:{data:[{...student,fee_balance:200,next_due:'2026-10-20',attendance_percentage:90,homework_pending:2,leave_updates:[{start_date:'2026-10-10',end_date:'2026-10-11',status:'informed'}]},{...student,id:2,first_name:'Meera',fee_balance:0,attendance_percentage:null,homework_pending:0,leave_updates:[]}]}}))
      await page.goto('/e2e/school_operations_harness.html?module=children')
      await expect(page.getByText('Meera Sharma',{exact:true})).toBeVisible()
      await page.getByRole('button',{name:'Fees',exact:true}).nth(1).click()
      await expect(page.getByText('Selected 2: fees')).toBeVisible()
    })
    test('promotion previews selected students before confirmation',async({page})=>{
      let payload
      await page.route('**/academic-years/promotion-preview',r=>{if(r.request().method()==='POST'){payload=r.request().postDataJSON();return r.fulfill({json:{data:[{...payload.promotions[0],student_name:'Aarav Sharma',from_class:'Grade 5',from_section:'A'}],capacities:[{class_name:'Grade 6',projected_students:1,reserved_seats:2,limit:30}]}})}return r.fulfill({json:{students:[student],classes:[{id:2,class_name:'Grade 6',section:'A'}]}})})
      await page.route('**/academic-years/promote',r=>{expect(r.request().postDataJSON()).toEqual({...payload,support_handovers:[]});return r.fulfill({json:{promoted:1}})})
      await page.goto('/e2e/school_operations_harness.html?module=promotion')
      await page.getByLabel('From year').selectOption('2025');await page.getByLabel('To year').selectOption('2026');await page.getByLabel('Destination class').selectOption('2')
      await page.getByRole('checkbox').check()
      await expect(page.getByRole('button',{name:'Confirm promotion'})).toHaveCount(0)
      await page.getByRole('button',{name:'Preview promotion'}).click()
      await expect(page.getByText('Grade 6: 1 students + 2 reserved seats / 30',{exact:true})).toBeVisible()
      await page.getByRole('button',{name:'Confirm promotion'}).click()
      await expect(page.getByRole('status')).toContainText('1 students promoted')
    })
    test('audit detail displays before and after values',async({page})=>{
      await page.goto('/e2e/school_operations_harness.html?module=audit')
      await page.getByText('View 2 field changes').click()
      await expect(page.getByRole('cell',{name:'300',exact:true})).toBeVisible()
      await expect(page.getByRole('cell',{name:'200',exact:true})).toBeVisible()
    })
  })
}
