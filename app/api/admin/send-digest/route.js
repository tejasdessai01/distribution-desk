import { supabaseAdmin } from '../../../lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  // simple auth
  const token = request.headers.get('x-admin-token')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const to = body.to || process.env.DEFAULT_TO_EMAIL
  const days = Math.min(Math.max(parseInt(body.days || '30', 10), 1), 90)
  if (!to) {
    return new Response(JSON.stringify({ error: 'Missing "to" email' }), { status: 400 })
  }
  if (!process.env.POSTMARK_TOKEN || !process.env.FROM_EMAIL) {
    return new Response(JSON.stringify({ error: 'Missing POSTMARK_TOKEN or FROM_EMAIL env var' }), { status: 500 })
  }

  // query events in next N days
  const now = new Date()
  const toDate = new Date(now.getTime() + days * 24 * 3600 * 1000)
  const fmt = (d) => d.toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('events')
    .select('ticker,name,event_type,ex_date,record_date,pay_date,amount')
    .gte('ex_date', fmt(now))
    .lte('ex_date', fmt(toDate))
    .order('ex_date', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const brand = process.env.BRAND_NAME || 'Distribution Desk'
  const html = buildHtmlEmail(brand, data || [], days)

  // send via Postmark
  const resp = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': process.env.POSTMARK_TOKEN
    },
    body: JSON.stringify({
      From: process.env.FROM_EMAIL,
      To: to,
      Subject: `${brand} — Upcoming ETF distributions (next ${days} days)`,
      HtmlBody: html
    })
  })

  if (!resp.ok) {
    const text = await resp.text()
    return new Response(JSON.stringify({ error: `Postmark: ${text}` }), { status: 500 })
  }

  return new Response(JSON.stringify({ sent: true, rows: (data || []).length }), {
    headers: { 'content-type': 'application/json' }
  })
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}

function buildHtmlEmail(brand, rows, days) {
  const head = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:720px;margin:0 auto;padding:16px">
      <h2 style="margin:0 0 6px">${esc(brand)} — Upcoming ETF distributions</h2>
      <div style="opacity:.75;margin:0 0 14px">Next ${days} days</div>
      <table role="table" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr>
            <th style="${th}">Ticker</th>
            <th style="${th}">Name</th>
            <th style="${th}">Type</th>
            <th style="${th}">Ex</th>
            <th style="${th}">Record</th>
            <th style="${th}">Pay</th>
            <th style="${th}">Amount</th>
          </tr>
        </thead>
        <tbody>
  `
  const body = (rows.length ? rows : []).map(r => `
      <tr>
        <td style="${td}">${esc(r.ticker)}</td>
        <td style="${td}">${esc(r.name)}</td>
        <td style="${td}">${esc(r.event_type || 'DIVIDEND')}</td>
        <td style="${td}">${esc(r.ex_date || '')}</td>
        <td style="${td}">${esc(r.record_date || '')}</td>
        <td style="${td}">${esc(r.pay_date || '')}</td>
        <td style="${td}">${r.amount ?? ''}</td>
      </tr>
  `).join('')

  const foot = `
        </tbody>
      </table>
      <div style="margin-top:12px;font-size:12px;opacity:.65">
        Informational only; not tax advice. Confirm dates/amounts with the issuer before trading.
      </div>
    </div>
  `
  return head + body + foot
}

const th = 'text-align:left;border-bottom:1px solid #eee;padding:8px;background:#fafafa'
const td = 'border-bottom:1px solid #eee;padding:8px'
