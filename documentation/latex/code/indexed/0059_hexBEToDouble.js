function hexBEToDouble(hex){
  if(!/^[0-9A-Fa-f]{16}$/.test(hex||""))return null;
  const b=new ArrayBuffer(8),dv=new DataView(b);
  dv.setUint32(0,parseInt(hex.slice(0,8),16),false);
  dv.setUint32(4,parseInt(hex.slice(8),16),false);
  const n=dv.getFloat64(0,false);
  return Number.isFinite(n)?n:null;
}
