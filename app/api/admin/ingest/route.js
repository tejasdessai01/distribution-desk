import Papa from 'papaparse'
import { supabaseAdmin } from '../../../lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  // simple auth
  const token = request.headers.get('x-admin-token')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // accept multipart form-data with a "file" field
  const form = await request.formData()
  const file = form.get('file')
  if (!file) {
    return new Response(JSON.stringify({ error: 'Missing file' }), { status: 400 })
  }

  const csvText = await file.text()

  // parse CSV
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: { amount: true }
  })
  if (result.errors?.length) {
    return new Response(JSON.stringify({ error: 'CSV parse error', details: result.errors.slice(0,3) }), { status: 400 })
  }

  // validate headers
  const required = ['ticker','name','event_type','ex_date','record_date','pay_date','amount']
  const headers = result.meta.fields || []
  for (const h of required) {
    if (!headers.includes(h)) {
      return new Response(JSON.stringify({ error: `Missing required column: ${h}` }), { status: 400 })
    }
  }

  // upsert without a unique index: delete-then-insert per row (fine for small batches)
  let inserted = 0, skipped = 0, errors = 0
  for (const row of result.data) {
    const ticker = String(row.ticker || '').toUpperCase().trim()
    if (!ticker) { skipped++; continue }

    // normalize dates to YYYY-MM-DD
    const toISO = (v) => v ? String(v).slice(0,10) : null
    const payload = {
      ticker,
      name: row.name || null,
      event_type: row.event_type || 'DIVIDEND',
      ex_date: toISO(row.ex_date),
      record_date: toISO(row.record_date),
      pay_date: toISO(row.pay_date),
      amount: typeof row.amount === 'number' ? row.amount : (row.amount ? Number(row.amount) : null)
    }

    try {
      // idempotency: remove existing exact match then insert
      await supabaseAdmin
        .from('events')
        .delete()
        .eq('ticker', payload.ticker)
        .eq('ex_date', payload.ex_date)
        .eq('event_type', payload.event_type)

      const { error } = await supabaseAdmin
        .from('events')
        .insert([payload])

      if (error) { errors++; console.error(error); }
      else inserted++
    } catch (e) {
      errors++; console.error(e)
    }
  }

  return new Response(JSON.stringify({ inserted, skipped, errors }), {
    headers: { 'content-type': 'application/json' }
  })
}
