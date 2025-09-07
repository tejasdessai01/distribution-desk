export default function Home() {
  return (
    <main style={{minHeight:'100vh',display:'flex',flexDirection:'column',gap:16,alignItems:'center',justifyContent:'center',padding:24}}>
      <h1>Never get blindsided by ETF distributions again.</h1>
      <p style={{maxWidth:720,textAlign:'center'}}>
        Paste tickers or upload a CSV (coming next) to see upcoming ex/record/pay dates and download a one-pager for each Tag.
      </p>
      <a href="/dashboard" style={{padding:'10px 14px',background:'#000',color:'#fff',borderRadius:8,textDecoration:'none'}}>
        Open Dashboard
      </a>
    </main>
  )
}
