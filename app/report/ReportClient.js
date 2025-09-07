'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ReportClient(){
  const searchParams = useSearchParams()
  const tickers = searchParams.get('tickers') || ''
  const titleParam = searchParams.get('title') || 'One-Pager'
  const [rows,setRows] = useState([])
  const [brandName, setBrandName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(()=>{
    // load brand from localStorage (set on the dashboard)
    const bn = localStorage.getItem('dd_brandName') || ''
    const lu = localStorage.getItem('dd_logoUrl') || ''
    setBrandName(bn)
    setLogoUrl(lu)
  },[])

  useEffect(()=>{
    (async ()=>{
      if(!tickers) return
      const r = await fetch(`/api/events?tickers=${encodeURIComponent(tickers)}`)
      const j = await r.json()
      setRows(j.events || [])
    })()
  },[tickers])

  return (
    <main style={{padding:24, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial'}}>
      <style>{`
        h1 { margin: 0 0 4px; }
        .muted { opacity: .6; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
        th { background: #fafafa; }
        .actions { margin: 12px 0 20px; }
        .brand { display:flex; align-items:center; gap:12px; margin-bottom: 10px; }
        .brand img { height: 28px; width:auto; object-fit:contain; }
        @media print {
          .actions { display: none; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="brand">
        {logoUrl ? <img src={logoUrl} alt="logo" /> : null}
        <div style={{fontSize:18, fontWeight:700}}>{brandName || 'Advisory'}</div>
      </div>
      <h1>{titleParam}</h1>
      <div className="muted">Upcoming ETF distributions (next 30–60 days)</div>

      <div className="actions">
        <button onClick={()=>window.print()} style={{padding:'8px 12px', background:'#000', color:'#fff', borderRadius:6}}>
          Print / Save as PDF
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Name</th>
            <th>Type</th>
            <th>Ex</th>
            <th>Record</th>
            <th>Pay</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td>{r.ticker}</td>
              <td>{r.name}</td>
              <td>{r.type}</td>
              <td>{r.exDate}</td>
              <td>{r.recordDate}</td>
              <td>{r.payDate}</td>
              <td>{r.amount ?? ''}</td>
            </tr>
          ))}
          {rows.length===0 && (
            <tr><td colSpan={7} style={{opacity:.6, padding:'16px'}}>No events found for selected tickers.</td></tr>
          )}
        </tbody>
      </table>

      <div style={{marginTop:16, fontSize:12, opacity:.65}}>
        Informational only; not tax advice. Confirm dates/amounts with the issuer before trading.
      </div>
    </main>
  )
}
