function isoLocal(ms){
  if(!(Number(ms)>0))return "";
  const d=new Date(Number(ms)),p=n=>String(n).padStart(2,"0"),o=-d.getTimezoneOffset();
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    +`${o>=0?"+":"-"}${p(Math.floor(Math.abs(o)/60))}:${p(Math.abs(o)%60)}`;
}
