async function readZip(buf){
  const u8=new Uint8Array(buf),dv=new DataView(buf);
  let e=-1;for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0)throw new Error("Not a ZIP container (no end-of-central-directory record). Is this really an .eds file?");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);
  const td=new TextDecoder();const entries=[];
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)throw new Error("Corrupt central directory");
    const method=dv.getUint16(p+10,true),mt=dv.getUint16(p+12,true),md=dv.getUint16(p+14,true),crc=dv.getUint32(p+16,true),
      csize=dv.getUint32(p+20,true),usize=dv.getUint32(p+24,true),fl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),
      cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=td.decode(u8.subarray(p+46,p+46+fl));
    const date=`${((md>>9)+1980)}-${String((md>>5)&15).padStart(2,"0")}-${String(md&31).padStart(2,"0")} ${String(mt>>11).padStart(2,"0")}:${String((mt>>5)&63).padStart(2,"0")}`;
    entries.push({name,method,crc,csize,usize,off,date,dir:name.endsWith("/")});
    p+=46+fl+xl+cl;
  }
  const cache=new Map();
  async function get(name){
    if(cache.has(name))return cache.get(name);
    const en=entries.find(x=>x.name===name);if(!en)return null;
    const o=en.off;if(dv.getUint32(o,true)!==0x04034b50)throw new Error("Bad local header: "+name);
    const s=o+30+dv.getUint16(o+26,true)+dv.getUint16(o+28,true);
    const raw=u8.subarray(s,s+en.csize);
    let data;if(en.method===0)data=raw;else if(en.method===8)data=await inflateRaw(raw);else throw new Error(`Unsupported compression ${en.method} in ${name}`);
    en.crcOk=crc32(data)===en.crc;cache.set(name,data);return data;
  }
  return{entries,get};
}
