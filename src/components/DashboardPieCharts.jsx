import {useState} from 'react'
import {chartSeries} from '../lib/chartSeries'
import './DashboardPieCharts.css'

function PieCard({chart}) {
  const {total,series,background}=chartSeries(chart.items)
  const [active,setActive]=useState(null)
  const selected=series.find(s=>s.label===active)
  return <section className="dashboard-pie-card" aria-label={chart.title}><header><div><h3>{chart.title}</h3><p>{chart.subtitle}</p></div><span>{total.toLocaleString()} total</span></header>
    <div className="dashboard-pie-content"><div className="dashboard-donut" role="img" aria-label={`${chart.title}: ${series.map(s=>`${s.label} ${s.value}`).join(', ')}`} style={{background}}><div><strong>{(selected?.value??total).toLocaleString()}</strong><span>{selected?.label||'Total'}</span>{selected&&<small>{selected.percentage.toFixed(1)}%</small>}</div></div>
      <ul className="dashboard-pie-legend">{series.map(s=><li key={s.label}><button type="button" aria-pressed={active===s.label} onMouseEnter={()=>setActive(s.label)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(s.label)} onBlur={()=>setActive(null)} onClick={()=>setActive(active===s.label?null:s.label)}><i style={{background:s.color}}/><span>{s.label}</span><b>{s.value.toLocaleString()}</b><small>{s.percentage.toFixed(1)}%</small></button></li>)}</ul></div>
    {!total&&<p className="dashboard-chart-empty">No records available yet.</p>}
  </section>
}
export default function DashboardPieCharts({charts=[]}) {return charts.length?<div className="dashboard-pie-grid">{charts.map(chart=><PieCard key={chart.key} chart={chart}/>)}</div>:null}
