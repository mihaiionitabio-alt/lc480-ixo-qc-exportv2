function sopTime(v){
  if(v==null||v==="")return NaN;if(typeof v==="number")return v;
  const s=String(v).trim();if(/^1899/.test(s))return NaN;
  const t=Date.parse(/^\d{4}-\d\d-\d\d \d/.test(s)?s.replace(" ","T"):s);return Number.isFinite(t)?t:NaN;
}
