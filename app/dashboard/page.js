'use client'
import { useState } from 'react'
import Papa from 'papaparse'

export default function Dashboard(){
  const [tickers,setTickers]=useState('VOO, QQQ, BND')
  const [rows,setRows]=useState([])              // events table (with tags)
  const [loading,setLoading]=useState(false)
  const [csvInfo,setCsvInfo]=useState({ total:0, tags:{} }) // summary of CSV: { total, tags: { TagName: [TICKER,...] } }
  const [tagMap,setTagMap]=useState({})          // { TagName: [TICKER, ...] }

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

        const uniqueTickers = Array.from(new Set(mapped.map(r=>r.ticker))) // <- fix
        setCsvInfo({ total: uniqueTickers.l
