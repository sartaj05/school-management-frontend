import {test,expect} from '@playwright/test'

test('credit date filters reset pagination and keep page requests bounded',async({page})=>{
  const requests=[]
  await page.route('**/api/v1/fees/bank-statement?*',route=>{
    const query=new URL(route.request().url()).searchParams
    requests.push(Object.fromEntries(query))
    return route.fulfill({json:{data:[{id:Number(query.get('page')),reference:`PAGE-${query.get('page')}`,date:'2026-01-01',amount:10,status:'unmatched',candidates:[]}],total:110,per_page:50,page:Number(query.get('page'))}})
  })
  await page.goto('/e2e/bank_pagination_harness.html')
  await expect(page.getByText('PAGE-1',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Next credits'}).click()
  await expect(page.getByText('PAGE-2',{exact:true})).toBeVisible()
  await page.getByLabel('Credit date from').fill('2026-01-01')
  await page.getByLabel('Credit date to').fill('2026-01-31')
  await page.getByRole('button',{name:'Apply credit dates'}).click()
  await expect(page.getByText('PAGE-1',{exact:true})).toBeVisible()
  expect(requests.at(-1)).toEqual({page:'1',per_page:'50',date_from:'2026-01-01',date_to:'2026-01-31'})
})
