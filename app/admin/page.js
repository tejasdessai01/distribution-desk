'use client'
import { useState } from 'react'

export default function AdminPage(){
  const [file, setFile] = useState(null)
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [days, setDays] = useState(30)

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

  async function sendDigest(){
    setMsg('Sending email…')
    const r = await fetch('/api/admin/send-digest', {
      method: 'POST',
      headers: {
        'x-admin-token': token,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ to: toEmail, days })
    })
    const j = await r.json()
    if (!r.ok) { setMsg(`Error: ${j.error || 'unknown'}`); return }
    setMsg(`Digest sent ✓ (${j.rows} rows)`)
  }

  return (
    <main style={{padding:24, maxWidth:700, fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial'}}>
      <h2>Admin</h2>

      <section style={{marginTop:16}}>
        <h3>Ingest Events CSV</h3>
        <p>CSV columns: <code>ticker,name,event_type,ex_date,record_date,pay_date,amount</code></p>
        <div style={{display:'grid', gap:12, marginTop:12}}>
          <input type="password" placeholder="Admin token" value={token} onChange={e=>setToken(e.target.value)} />
          <input type="file" accept=".csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
          <button onClick={ingest} style={{padding:'8px 12px', background:'#000', color:'#fff', borderRadius:6}}>Ingest CSV</button>
        </div>
      </section>

      <hr style={{margin:'20px 0'}} />

      <section>
        <h3>Send Weekly Digest (test)</h3>
        <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:10, alignItems:'center', maxWidth:520}}>
          <label>To</label>
          <input type="email" placeholder="you@yourdomain.com" value={toEmail} onChange={e=>setToEmail(e.target.value)} />
          <label>Days ahead</label>
          <input type="number" min={1} max={90} value={days} onChange={e=>setDays(parseInt(e.target.value||'30',10))} />
        </div>
        <div style={{marginTop:10}}>
          <button onClick={sendDigest} style={{padding:'8px 12px', background:'#000', color:'#fff', borderRadius:6}}>
            Send digest
          </button>
        </div>
      </section>

      <div style={{fontSize:12, opacity:.8, marginTop:12}}>{msg}</div>
    </main>
  )
}
