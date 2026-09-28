async function ccIxoAcquisitions(text){
  const m=text.match(/name="AcquisitionStore"[^>]*>([^<]+)</);if(!m)return [];
  const inner=new TextDecoder().decode(await inflate(base64ToBytes(m[1].trim()),"deflate"));
  const out=[],re=/name="Time">(\d+)<\/prop>\s*<prop name="Temp">\$?([0-9A-Fa-f.]+)<\/prop>\s*<prop name="Channel">(\d+)<\/prop>\s*<prop name="IntgrTime">(\d+)<\/prop>\s*<prop name="Valid">(\d+)<\/prop>\s*<prop name="RefValue">\$?([0-9A-Fa-f.]+)</g;
  const dbl=h=>/^[0-9A-Fa-f]{16}$/.test(h)?hexBEToDouble(h):Number(h);
  let r;while((r=re.exec(inner)))out.push({ms:+r[1],temp:dbl(r[2]),channel:+r[3],intgr:+r[4],valid:r[5]==="1",ref:dbl(r[6])});
  return out;
}
