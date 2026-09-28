function ccDecodeArz(b64){
  /* "DARZ" (float64) / "LARZ" (uint32) + a header whose length varies between files (12 or 13 bytes seen), then the values,
     raw or LZSS-compressed. Every candidate start is tried and the one whose whole array is plausible wins
     (temperatures −50…200 °C, times never decreasing). A wrong start gives garbage such as 1e+102 °C. */
  const b=base64ToBytes(b64.trim()),isD=b[0]===0x44,size=isD?8:4;
  const read=u=>{const dv=new DataView(u.buffer,u.byteOffset,u.byteLength),n=Math.floor(u.length/size),o=new Float64Array(n);
    for(let k=0;k<n;k++)o[k]=isD?dv.getFloat64(k*size,true):dv.getUint32(k*size,true);return o;};
  const score=a=>{if(a.length<2)return -1;let ok=0;for(let i=0;i<a.length;i++){const v=a[i];
    if(isD?(Number.isFinite(v)&&v>-50&&v<200&&Math.abs(v)>1e-6):(i===0||v>=a[i-1]))ok++;}return ok/a.length;};
  let best=null,bs=-1;
  for(const off of [13,12,14,11,15,10,16])for(const a of [read(b.subarray(off)),read(ccLzss(b,off))]){
    const sc=score(a);if(sc>bs+1e-9){bs=sc;best=a;}if(bs>=0.999)return best;}
  return best||new Float64Array(0);
}
