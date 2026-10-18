export const chartColors = ['#7760bd','#28a88c','#f3a832','#e97478','#5c8bdb','#bd78be','#7f91a6','#b5ad61']
export function chartSeries(items = []) {
  const series = items.map((item,index) => ({label:String(item.label || 'Unspecified'),value:Math.max(0,Number.isFinite(Number(item.value))?Number(item.value):0),color:chartColors[index%chartColors.length]}))
  const total = series.reduce((sum,item)=>sum+item.value,0)
  let offset=0
  const slices=series.map(item=>{const start=offset;offset+=total?item.value/total*100:0;return {...item,percentage:total?item.value/total*100:0,stop:`${item.color} ${start}% ${offset}%`}})
  return {total,series:slices,background:total?`conic-gradient(${slices.filter(s=>s.value>0).map(s=>s.stop).join(',')})`:'#e8e5ef'}
}
