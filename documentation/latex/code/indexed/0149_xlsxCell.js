function xlsxCell(ref,v){
  if(v==null||v==="")return typeof v==="string"?`<c r="${ref}" t="inlineStr"><is><t></t></is></c>`:"";
  if(typeof v==="number"&&Number.isFinite(v))return `<c r="${ref}"><v>${v}</v></c>`;
  const sv=String(v);
  if(/^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(sv)&&typeof v!=="string")return `<c r="${ref}"><v>${Number(sv)}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(sv.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""))}</t></is></c>`;
}
