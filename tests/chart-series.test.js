import test from 'node:test'
import assert from 'node:assert/strict'
import {chartSeries} from '../src/lib/chartSeries.js'

test('chart totals and proportions reflect actual counts', () => {
  const data=chartSeries([{label:'Present',value:3},{label:'Absent',value:1},{label:'Late',value:0}])
  assert.equal(data.total,4)
  assert.deepEqual(data.series.map(item=>item.percentage),[75,25,0])
  assert.match(data.background,/conic-gradient/)
  assert.doesNotMatch(data.background,/NaN|Infinity/)
})
test('empty and invalid chart counts never invent percentages', () => {
  for(const items of [[],[{value:-1},{value:'bad'},{value:Infinity},{value:0}]]) {
    const data=chartSeries(items)
    assert.equal(data.total,0)
    assert.equal(data.background,'#e8e5ef')
    assert.ok(data.series.every(item=>item.percentage===0))
  }
})
