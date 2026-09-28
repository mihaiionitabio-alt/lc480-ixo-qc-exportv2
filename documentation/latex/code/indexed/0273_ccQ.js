const ccQ=(a,p)=>{const s=(a||[]).filter(Number.isFinite).sort((x,y)=>x-y);return s.length?s[Math.min(s.length-1,Math.floor(p*s.length))]:NaN;};
