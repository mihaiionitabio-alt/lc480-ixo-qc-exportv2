function qsInstrument(r){
  const e=r.exp,p=e.props||{},key=e.instrumentTypeKey||"";
  let model="",block="";
  const m=(p.instrumentType||"").match(/QuantStudio\s*(\d+)\s*-\s*(.*)$/i);
  if(m){model=m[1];block=m[2];}
  if(!model)model=/PERFORM/.test(key)?"5":/AFFORD/.test(key)?"3":/PICANTO/.test(key)?"1":/384WELL/.test(key)?"5":"";
  if(!block){const v=key.match(/(\d+)WELL(?:_[A-Z]+)?_(\d+)UL/);
    if(v)block=v[1]==="384"?"384-Well Block":`${v[1]}-Well ${(Number(v[2])/1000).toFixed(1)}-mL Block`;}
  const sn=p.instrumentSerialNumber||(r.inst||{}).sn||"";
  return {model,block:block||r.plate.kind,type:model?`QuantStudio™ ${model} System`:"",serial:sn,
    name:p.instrumentName!=null&&p.instrumentName!==""?p.instrumentName:(sn?"      "+sn:"")};
}
