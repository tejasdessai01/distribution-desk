export async function GET(request){
  const { searchParams } = new URL(request.url)
  const tickersParam = searchParams.get('tickers') || ''
  const tickers = tickersParam.split(/[\s,]+/).map(s=>s.trim().toUpperCase()).filter(Boolean)

  // mock a few events per ticker (so you can test UX before wiring data)
  const today = new Date()
  const fmt = (d)=> d.toISOString().slice(0,10)

  const events = tickers.flatMap((t,i)=>{
    const base = new Date(today.getTime()+ (i+1)*3*24*3600*1000)
    return [
      { ticker:t, name:`${t} Fund`, type:'DIVIDEND', exDate:fmt(base), recordDate:fmt(addDays(base,1)), payDate:fmt(addDays(base,5)), amount: Math.random()>0.5? (0.1+Math.random()*0.5).toFixed(2): null },
      { ticker:t, name:`${t} Fund`, type:'DIVIDEND', exDate:fmt(addDays(base,30)), recordDate:fmt(addDays(base,31)), payDate:fmt(addDays(base,35)), amount: null }
    ]
  })

  return new Response(JSON.stringify({ events }), { headers: { 'content-type':'application/json' }})
}

function addDays(date,days){ const d = new Date(date); d.setDate(d.getDate()+days); return d }
