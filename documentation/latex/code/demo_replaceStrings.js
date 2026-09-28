function replaceStrings(obj,map){
  const keys=[...map.keys()].filter(k=>k&&k.length>=2).sort((a,b)=>b.length-a.length);
  const seen=new WeakSet();
  const walk=(o,depth)=>{if(!o||typeof o!=="object"||depth>10||ArrayBuffer.isView(o)||seen.has(o))return;seen.add(o);
    if(o instanceof Map){for(const [k,v] of o){if(typeof v==="string")o.set(k,rep(v));else walk(v,depth+1);}return;}
    for(const k of Object.keys(o)){const v=o[k];if(typeof v==="string")o[k]=rep(v);else if(v&&typeof v==="object")walk(v,depth+1);}};
  const rep=s=>{if(map.has(s))return map.get(s);let out=s;for(const k of keys)if(out.includes(k))out=out.split(k).join(map.get(k));return out;};
  walk(obj,0);
}