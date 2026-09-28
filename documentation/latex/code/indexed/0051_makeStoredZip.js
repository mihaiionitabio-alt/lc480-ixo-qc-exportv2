function makeStoredZip(entries){
  const enc=new TextEncoder(),now=dosStamp(new Date()),locals=[],central=[];let offset=0;
  for(const e of entries){
    const nameBytes=enc.encode(e.name),data=bytesFrom(e.data),crc=crc32(data);
    const lh=new Uint8Array(30+nameBytes.length),dv=new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint16(6,0x0800,true);dv.setUint16(8,0,true);
    dv.setUint16(10,now.t,true);dv.setUint16(12,now.d,true);dv.setUint32(14,crc,true);
    dv.setUint32(18,data.length,true);dv.setUint32(22,data.length,true);
    dv.setUint16(26,nameBytes.length,true);dv.setUint16(28,0,true);lh.set(nameBytes,30);
    locals.push(lh,data);
    const ch=new Uint8Array(46+nameBytes.length),cv=new DataView(ch.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,0,true);
    cv.setUint16(12,now.t,true);cv.setUint16(14,now.d,true);cv.setUint32(16,crc,true);
    cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);
    cv.setUint16(28,nameBytes.length,true);cv.setUint32(42,offset,true);ch.set(nameBytes,46);
    central.push(ch);
    offset+=lh.length+data.length;
  }
  const centralSize=central.reduce((a,c)=>a+c.length,0);
  const eocd=new Uint8Array(22),ev=new DataView(eocd.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);
  ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
  const parts=[...locals,...central,eocd],total=parts.reduce((a,p)=>a+p.length,0),out=new Uint8Array(total);
  let p=0;for(const part of parts){out.set(part,p);p+=part.length;}
  return out;
}
