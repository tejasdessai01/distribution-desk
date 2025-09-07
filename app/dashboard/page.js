'use client'
import { useEffect, useState } from 'react'
import Papa from 'papaparse'

export default function Dashboard(){
  const [tickers,setTickers]=useState('VOO, QQQ, BND')
  const [rows,setRows]=useState([])              // events table (with tags)
  const [loading,setLoading]=useState(false)
  const [csvInfo,setCsvInfo]=useState({ total:0, tags:{} }) // { total, tags: { TagName: [TICKER,...] } }
  const [tagMap,setTagMap]=useState({})          // { TagName: [TICKER, ...] }

  // Branding (stored locally in the browser)
  const [brandName, setBrandName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    // load saved branding
    const bn = localStorage.getItem('dd_brandName') || ''
    const lu = localStorage.getItem('dd_logoUrl') || ''
    setBrandName(bn)
    setLogoUrl(lu)
  }, [])

  function saveBranding() {
    localStorage.setItem('dd_brandName', brandName.trim())
    localStorage.setItem('dd_logoUrl', logoUrl.trim())
    setSavedMsg('Saved ✓')
    setTimeout(()=>setSavedMsg(''), 1500)
  }

  function sanitizeTicker(s){
    const out = String(s||'').toUpperCase().replace(/[^A-Z0-9.-]/g,'').slice(0,6)
    return out
  }

  function mapRow(row){
    // header aliases
    const t = row.Ticker || row.Symbol || row.SYMBOL || row.symbol || ''
    let ticker = t
    if(!ticker && row.Security){
      // try to extract first ticker-like token from "Security" cell
      const m = String(row.Security).toUpperCase().match(/[A-Z0-9.-]{1,6}/)
      if(m) ticker = m[0]
    }
    ticker = sanitizeTicker(ticker)
    if(!ticker) return null

    const tag = (row.Tag || row.Household || row.Model || row.Client || row.HHID || '').toString().trim()
    const custodian = (row.Custodian || row.Platform || '').toString().trim()
    return { ticker, tag, custodian }
  }

  function handleCSV(e){
    const file = e.target.files?.[0]
    if(!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res)=>{
        const mapped = res.data.map(mapRow).filter(Boolean)

        // Build Tag -> Tickers map
        const m = {}
        for(const r of mapped){
          const tag = r.tag || 'Untagged'
          m[tag] = m[tag] || new Set()
          m[tag].add(r.ticker)
        }
        const tags = Object.fromEntries(Object.entries(m).map(([k,v])=>[k, Array.from(v)]))
        setTagMap(tags)

        const uniqueTickers = Array.from(new Set(mapped.map(r=>r.ticker)))
        setCsvInfo({ total: uniqueTickers.length, tags })

        // also prefill the paste box with unique tickers from CSV
        setTickers(uniqueTickers.join(', '))
      }
    })
  }

  function buildTagIndex(map){
    // ticker -> [tags]
    const idx = {}
    for(const [tag, arr] of Object.entries(map)){
      for(const tk of arr){
        if(!idx[tk]) idx[tk] = []
        idx[tk].push(tag)
      }
    }
    return idx
  }

  async function fetchEvents(){
    setLoading(true)
    const qs = new URLSearchParams({ tickers })
    const r = await fetch(`/api/events?${qs.toString()}`)
    const j = await r.json()
    const tagIndex = buildTagIndex(tagMap)
    const enriched = (j.events||[]).map(ev => ({
      ...ev,
      tags: tagIndex[ev.ticker] || []
    }))
    setRows(enriched)
    setLoading(false)
  }

  const tagCount = Object.keys(tagMap).length

  return (
    <div style={{padding:24, maxWidth: 900}}>
      <h2>Watchlist</h2>
      <p>Paste tickers separated by commas or new lines, or upload a CSV.</p>

      <label style={{display:'block',marginTop:8,fontWeight:600}}>Paste tickers</label>
      <textarea value={tickers} onChange={e=>setTickers(e.target.value)} style={{width:'100%',height:100}}/>

      <div style={{marginTop:12,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
        <button onClick={fetchEvents} disabled={loading} style={{padding:'8px 12px',background:'#000',color:'#fff',borderRadius:6}}>
          {loading? 'Loading…':'Show Upcoming Events'}
        </button>

        <div>
          <label style={{display:'block',fontWeight:600}}>or Upload CSV</label>
          <input type="file" accept=".csv" onChange={handleCSV}/>
          <div style={{fontSize:12,opacity:0.8,marginTop:4}}>
            CSV headers accepted: <code>Ticker</code> (required). Optional aliases: <code>Symbol</code>, <code>Security</code>. Optional <code>Tag</code> (aliases: Household, Model, Client, HHID) and <code>Custodian</code> (alias: Platform).
          </div>
        </div>
      </div>

      {/* Branding settings */}
      <div style={{marginTop:20, border:'1px solid #eee', padding:12, borderRadius:8}}>
        <div style={{fontWeight:700, marginBottom:8}}>Branding (for one-pager)</div>
        <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'center'}}>
          <label>Brand Name</label>
          <input
            placeholder="e.g., Dessai Wealth"
            value={brandName}
            onChange={e=>setBrandName(e.target.value)}
            style={{padding:'8px', border:'1px solid #ddd', borderRadius:6}}
          />
          <label>Logo URL</label>
          <input
            placeholder="https://…/logo.png (optional)"
            value={logoUrl}
            onChange={e=>setLogoUrl(e.target.value)}
            style={{padding:'8px', border:'1px solid #ddd', borderRadius:6}}
          />
        </div>
        <div style={{marginTop:10, display:'flex', gap:10, alignItems:'center'}}>
          <button onClick={saveBranding} style={{padding:'6px 10px', border:'1px solid #ddd', borderRadius:6}}>Save</button>
          <span style={{fontSize:12, opacity:.8}}>{savedMsg}</span>
        </div>
        <div style={{fontSize:12, opacity:.7, marginTop:6}}>
          Tip: Open a one-pager after saving; it will automatically pick up your brand.
        </div>
      </div>

      {csvInfo.total>0 && (
        <div style={{marginTop:16, border:'1px solid #eee', padding:12, borderRadius:8}}>
          <b>CSV loaded:</b> {csvInfo.total} unique tickers • {tagCount} tag{tagCount!==1?'s':''}
          <div style={{display:'grid',gridTemplateColumns:'1fr 3fr',gap:8, marginTop:8}}>
            {Object.entries(csvInfo.tags).map(([tag,arr])=>{
              const url = `/report?title=${encodeURIComponent(tag)}&tickers=${encodeURIComponent(arr.join(', '))}`
              return (
                <div key={tag} style={{borderTop:'1px solid #f2f2f2',paddingTop:6}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <div style={{fontWeight:600}}>{tag}</div>
                    <a href={url} target="_blank" rel="noreferrer"
                      style={{fontSize:12, padding:'4px 8px', border:'1px solid #ddd', borderRadius:6, textDecoration:'none'}}>
                      Open one-pager
                    </a>
                  </div>
                  <div style={{fontSize:12,opacity:0.9, marginTop:4}}>{arr.join(', ')}</div>
                </div>
              )
            })}
          </div>

          {/* All-tags one-pager */}
          <div style={{marginTop:10}}>
            <a
              href={`/report?title=${encodeURIComponent('All Tags')}&tickers=${encodeURIComponent(Object.values(csvInfo.tags).flat().join(', '))}`}
              target="_blank" rel="noreferrer"
              style={{fontSize:12, padding:'4px 8px', border:'1px solid #ddd', borderRadius:6, textDecoration:'none'}}
            >
              Open one-pager (All tags)
            </a>
          </div>
        </div>
      )}

      {rows.length>0 && (
        <div style={{marginTop:24,overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',minWidth:900}}>
            <thead>
              <tr>
                <th style={th}>Tags</th>
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
                  <td style={td}>{(r.tags||[]).join(', ')}</td>
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
