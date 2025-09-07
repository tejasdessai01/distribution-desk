'use client'
import { useState } from 'react'

export default function Dashboard(){
  const [tickers,setTickers]=useState('VOO, QQQ, BND')
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(false)

  async function fetchEvents(){
    setLoading(true)
    const qs = new URLSearchParams({ tickers })
    const r = await fetch(`/api/events?${qs.toString()}`)
    const j = await r.json()
    setRows(j.events||[])
    setLoading(false)
  }

  return (
    <div style={{padding:24}}>
      <h2>Watchlist</h2>
      <p>Enter tickers separated by commas or new lines. Example: VOO, QQQ, BND</p>
      <textarea value={tickers} onChange={e=>setTickers(e.target.value)} style={{width:'100%',maxWidth:640,height:100}}/>
      <div style={{marginTop:8}}>
        <button onClick={fetchEvents} disabled={loading} style={{padding:'8px 12px',background:'#000',color:'#fff',borderRadius:6}}>
          {loading? 'Loading…':'Show Upcoming Events'}
        </button>
      </div>

      {rows.length>0 && (
        <div style={{marginTop:24,overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',minWidth:720}}>
            <thead>
              <tr>
                <th style={th}>Ticker</th>
                <th style={th}>Name</th>
                <th style={th}>Type</th>
                <th style={th}>Ex</th>
                <th style={th}>Record</th>
                <th style={th}>Pay</th>
                <th style={th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> (
                <tr key={i}>
                  <td style={td}>{r.ticker}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.type}</td>
                  <td style={td}>{r.exDate}</td>
                  <td style={td}>{r.recordDate}</td>
                  <td style={td}>{r.payDate}</td>
                  <td style={td}>{r.amount ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th = {border:'1px solid #eee',padding:'8px',textAlign:'left',background:'#f8f8f8'}
const td = {border:'1px solid #eee',padding:'8px'}
