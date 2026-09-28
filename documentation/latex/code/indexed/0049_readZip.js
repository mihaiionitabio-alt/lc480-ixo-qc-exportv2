async function readZip(ab,archive,filter=/\.ixo$/i){
  const u8=new Uint8Array(ab),dv=new DataView(ab);let eocd=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-66000);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw new Error("ZIP end-of-central-directory not found");
  const count=dv.getUint16(eocd+10,true);let ptr=dv.getUint32(eocd+16,true);const out=[];
  for(let i=0;i<count;i++){
    if(dv.getUint32(ptr,true)!==0x02014b50)throw new Error("ZIP central directory is corrupt");
    const method=dv.getUint16(ptr+10,true),crc=dv.getUint32(ptr+16,true),csize=dv.getUint32(ptr+20,true),usize=dv.getUint32(ptr+24,true);
    const nLen=dv.getUint16(ptr+28,true),eLen=dv.getUint16(ptr+30,true),cLen=dv.getUint16(ptr+32,true),lho=dv.getUint32(ptr+42,true);
    const name=new TextDecoder().decode(u8.subarray(ptr+46,ptr+46+nLen));
    ptr+=46+nLen+eLen+cLen;
    if(name.endsWith("/"))continue;
    if(filter&&!filter.test(name))continue;
    const lnLen=dv.getUint16(lho+26,true),leLen=dv.getUint16(lho+28,true),start=lho+30+lnLen+leLen;
    const comp=u8.subarray(start,start+csize);
    let data;
    if(method===0)data=comp.slice();
    else if(method===8)data=await inflate(comp,"deflate-raw");
    else throw new Error(`ZIP entry ${name} uses unsupported compression method ${method}`);
    if(data.length!==usize)throw new Error(`ZIP entry ${name} size mismatch`);
    const actual=crc32(data);
    if(actual!==crc)throw new Error(`ZIP entry ${name} CRC-32 mismatch`);
    out.push({name:name.split("/").pop(),path:name,bytes:data,archive,zip:{declaredSize:usize,method,crcVerified:true}});
  }
  return out;
}
