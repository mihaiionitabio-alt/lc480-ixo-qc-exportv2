function makeZip(files){ // [{name, data:Uint8Array}]
  const enc=new TextEncoder();const parts=[];const cen=[];let off=0;
  for(const f of files){
    const nm=enc.encode(f.name),d=f.data,c=crc32(d);
    const h=new Uint8Array(30+nm.length),v=new DataView(h.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(8,0,true);v.setUint32(14,c,true);
    v.setUint32(18,d.length,true);v.setUint32(22,d.length,true);v.setUint16(26,nm.length,true);h.set(nm,30);
    parts.push(h,d);
    const ch=new Uint8Array(46+nm.length),cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,c,true);
    cv.setUint32(20,d.length,true);cv.setUint32(24,d.length,true);cv.setUint16(28,nm.length,true);cv.setUint32(42,off,true);ch.set(nm,46);
    cen.push(ch);off+=h.length+d.length;
  }
  const cs=cen.reduce((s,x)=>s+x.length,0);const end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cs,true);ev.setUint32(16,off,true);
  return new Blob([...parts,...cen,end],{type:"application/zip"});
}
