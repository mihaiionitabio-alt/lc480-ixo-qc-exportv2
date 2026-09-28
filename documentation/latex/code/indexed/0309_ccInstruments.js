function ccInstruments(){const by=byKey(ccAllRows(),r=>r.instrument);return [...by].sort((a,b)=>b[1].length-a[1].length).map(([k,v])=>({key:k,n:v.length,platform:v[0].platform}));}
