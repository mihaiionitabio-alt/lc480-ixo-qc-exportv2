function qsStamp(ms){
  if(!ms)return "";const d=new Date(ms);
  let tz="";try{tz=new Intl.DateTimeFormat("en-GB",{timeZoneName:"short"}).formatToParts(d).find(p=>p.type==="timeZoneName").value;}catch(e){}
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${d.getHours()<12?"AM":"PM"}${tz?" "+tz:""}`;
}
