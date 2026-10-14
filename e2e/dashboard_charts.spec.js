import {test,expect} from '@playwright/test'
for(const width of [390,768,1440]) for(const role of ['super_admin','admin','teacher','empty']) {
  test(`${role} charts at ${width}px show counts without overflow`,async({page})=>{
    await page.setViewportSize({width,height:1000})
    await page.goto(`/e2e/dashboard_charts_harness.html?role=${role}`)
    await expect(page.getByRole('img').first()).toBeVisible()
    await page.locator('.dashboard-pie-legend button').first().focus()
    await expect(page.locator('.dashboard-pie-legend button').first()).toHaveAttribute('aria-pressed','true')
    if(role==='empty') await expect(page.getByText('No records available yet.')).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.screenshot({path:`test-results/charts-${role}-${width}.png`,fullPage:true})
  })
}
