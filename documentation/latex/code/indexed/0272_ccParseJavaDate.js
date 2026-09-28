function ccParseJavaDate(s){                    // "#Mon Jun 15 15:35:04 EEST 2026" → epoch ms, or NaN
  const m=String(s||"").match(/\w{3} (\w{3}) +(\d+) (\d\d):(\d\d):(\d\d) (\w+) (\d{4})/);if(!m||!(m[6] in CC_TZ))return NaN;
  const mon="JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[1])/3;
  return Date.UTC(+m[7],mon,+m[2],+m[3],+m[4],+m[5])-CC_TZ[m[6]]*3600000;
}
