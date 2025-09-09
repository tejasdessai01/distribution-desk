import { supabaseAdmin } from '../../../lib/supabase-admin'

// ENV required (Vercel → Project → Settings → Environment Variables):
// ADMIN_TOKEN          → simple shared secret to call this route
// NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY  → already set from Step 9
// SENDGRID_API_KEY     → SendGrid API key (Single Sender is ok)
// FROM_EMAIL           → your verified Single Sender email
// Optional:
// DEFAULT_TO_EMAIL     → fallback recipient for testing
// BRAND_NAME           → shown in subject and email header

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  // --- auth ---
  const token = request.headers.get('x-admin-token')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const to = body.to || process.env.DEFAULT_TO_EMAIL
  const days = Math.min(Math.max(parseInt(body.days || '30', 10), 1), 90)

  if (!to) return new Response(JSON.stringify({ error: 'Missing "to" email' }), { status: 400 })
  if (!process.env.SENDGRID_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing SENDGRID_API_KEY' }), { status: 500 })
  }
  if (!process.env.FROM_EMAIL) {
    return new Response(JSON.stringify({ error: 'Missing FROM_EMAIL' }), { status: 500 })
  }

  // --- fetch events from Supabase ---
  const now = new Date()
  const toDate = new Date(now.getTime() + days * 24 * 3600 * 1000)
  const fmt = d => d.toISOString().slice(0, 10)

  const { data, error } = await supabaseAdmin
    .from('events')
    .select('ticker,name,event_type,ex_date,record_date,pay_date,amount')
    .gte('ex_date', fmt(now))
    .lte('ex_date', fmt(toDate))
    .order('ex_date', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const brand = process.e
