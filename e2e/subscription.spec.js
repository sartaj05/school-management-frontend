import {test, expect} from '@playwright/test'

for (const width of [390, 1440]) {
  test(`subscription suspension and reactivation at ${width}`, async ({page}) => {
    await page.setViewportSize({width, height:900})
    const saved=[]
    let subscription={plan:'premium',status:'active',effective_status:'active',access_enabled:true,
      trial_ends_at:null,plan_ends_at:'2030-12-31T23:59:00'}
    await page.route('**/api/v1/super-admin/schools/3/subscription', route => {
      if(route.request().method()==='PATCH') {
        const body=route.request().postDataJSON(); saved.push(body)
        subscription={...subscription,...body,effective_status:body.status,access_enabled:body.status==='active'}
      }
      return route.fulfill({json:{subscription}})
    })
    await page.route('**/api/v1/super-admin/schools/3/subscription/history?*',route=>route.fulfill({json:{items:[{
      id:1,changed_at:'2026-10-22T12:00:00',changed_by:1,reason:'Annual renewal',old_plan:'trial',new_plan:'premium',old_status:'trialing',new_status:'active',snapshot_complete:true,
      old_plan_ends_at:null,new_plan_ends_at:'2030-12-31T23:59:00',old_trial_ends_at:'2026-11-01T00:00:00',new_trial_ends_at:null
    }],page:1,per_page:25,total:1}}))
    await page.goto('/e2e/subscription_harness.html')
    await expect(page.getByRole('region',{name:'Subscription history'})).toContainText('Annual renewal')
    await expect(page.getByRole('region',{name:'Subscription history'})).toContainText('No expiry → 2030-12-31T23:59:00')
    await page.getByLabel('Subscription status').selectOption('suspended')
    await page.getByRole('button',{name:'Save subscription'}).click()
    expect(saved).toHaveLength(0)
    await page.getByLabel('Change reason').fill('School requested a pause')
    await page.getByRole('button',{name:'Save subscription'}).click()
    await expect(page.getByText('Workspace access:',{exact:false})).toContainText('Disabled')
    expect(saved[0].plan_ends_at).toBe('2030-12-31T23:59:00.000Z')
    await page.getByLabel('Subscription status').selectOption('active')
    await page.getByLabel('Plan expiry (UTC)').fill('')
    await page.getByLabel('Change reason').fill('Renewed without an expiry')
    await page.getByRole('button',{name:'Save subscription'}).click()
    await expect(page.getByText('Workspace access:',{exact:false})).toContainText('Enabled')
    expect(saved[1].plan_ends_at).toBeNull()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}
