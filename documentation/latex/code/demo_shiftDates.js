function shiftDates(obj,dms){
  const iso=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  const seen=new WeakSet();
  const walk=(o,depth)=>{if(!o||typeof o!=="object"||depth>9)return;
    if(ArrayBuffer.isView(o)||seen.has(o))return;seen.add(o);
    for(const k of Object.keys(o)){const v=o[k];
      if(typeof v==="string"){const m=v.match(iso);if(m){const zone=m[8]||"",t=Date.parse(v+(zone?"":"Z"))+dms,d=new Date(t);
          o[k]=`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${m[7]?"."+pad(d.getUTCMilliseconds(),3):""}${zone}`;}}
      else if(typeof v==="number"&&v>1.3e9&&v<2.2e9&&/^(first|last|start|end|mfTime|ts|exp)$/.test(k))o[k]=v+dms/1000;
      else if(typeof v==="number"&&v>1.3e12&&v<2.2e12)o[k]=v+dms;
      else if(v&&typeof v==="object")walk(v,depth+1);}};
  walk(obj,0);
}