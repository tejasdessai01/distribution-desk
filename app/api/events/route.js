import { supabase } from '../../lib/supabase'

// Avoid static prerender issues
export const dynamic = 'force-dynamic'

export async function GET(request){
  const { searchParams } = new URL(request.url)
  const tickersParam = searchParams.get('tickers') || ''
  const tickers = tickersParam.split(/[\s,]+/).map(s=>s.trim().toUpperCase()).filter(Boolean)

  // date window: now .. +60 days
  const now = new Date()
  const to = new Date(now.getTime() + 60*24*3600*1000)
  const fmt = (d)=> d.toISOString().slice(0,10)

  let query = supabase
    .from('events')
    .select('ticker,name,event_type,ex_date,record_date,pay_date,amount')
    .gte('ex_date', fmt(now))
    .lte('ex_date', fmt(to))
    .order('ex_date', { ascending: true })

  if (tickers.length) query = query.in('ticker', tickers)

  const { data, error } = await query
  if (error) {
    return new Response(JSON.stringify({ events: [], error: error.message }), { status: 500 })
  }

  const events = (data||[]).map(r => ({
    ticker: r.ticker,
    name: r.name,
    type: r.event_type || 'DIVIDEND',
    exDate: r.ex_date,
    recordDate: r.record_date,
    payDate: r.pay_date,
    amount: r.amount
  }))

  return new Response(JSON.stringify({ events }), { headers: { 'content-type':'application/json' }})
}
