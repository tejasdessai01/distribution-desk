'use client'
import { useState } from 'react'

export default function AdminPage(){
  const [file, setFile] = useState(null)
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState('')

  async function ingest(){
    if (!file) { setMsg('Choose a CSV first.'); return }
    setMsg('Uploading…')
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/admin/ingest', {
      method: 'POST',
      body: fd,
      headers: { 'x-admin-token': token }
    })
    const j = await r.json()
    if (!r.ok) { setMsg(`Error: ${j.error || 'unknown'}`); return }
    setMsg(`Done. Inserted: ${j.inserted} | Skipped: ${j.skipped} | Errors: ${j.errors}`)
  }

  return (
    <main style={{padding:24, maxWidth:600, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial'}}>
      <h2>Admin — Ingest Events CSV</h2>
      <p>Upload a CSV with columns: <code>ticker,name,event_type,ex_date,record_date,pay_date,amount</code></p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        <input type="password" placeholder="Admin token" value={token} onChange={e=>setToken(e.target.value)} />
        <input type="file" accept=".csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <button onClick={ingest} style={{padding:'8px 12px', background:'#000', color:'#fff', borderRadius:6}}>Ingest CSV</button>
        <div style={{fontSize:12, opacity:.8}}>{msg}</div>
      </div>

      <hr style={{margin:'20px 0'}} />

      <div style={{fontSize:12, opacity:.8}}>
        Tip: Use the sample: <code>events_supabase.csv</code> (the one you loaded earlier).
      </div>
    </main>
  )
}
