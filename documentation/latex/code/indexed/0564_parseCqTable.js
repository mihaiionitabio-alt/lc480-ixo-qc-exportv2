function parseCqTable(text,source){
  if(typeof text!=="string")return {error:"The pasted table is not text."};
  if(text.length>APP_LIMITS.maxCqTextBytes)return {error:`The pasted table is larger than ${(APP_LIMITS.maxCqTextBytes/1048576).toFixed(0)} MiB.`};
  const raw=text.replace(/\r\n?/g,"\n").split("\n").filter(l=>l.trim()!=="");
  if(!raw.length)return {error:"The text is empty."};
  if(raw.length>APP_LIMITS.maxCqRows+31)return {error:`The pasted table has more than ${APP_LIMITS.maxCqRows.toLocaleString()} data rows.`};
  const delim=(raw[0].match(/\t/g)||[]).length>(raw[0].match(/,/g)||[]).length?"\t"
    :((raw[0].match(/;/g)||[]).length>(raw[0].match(/,/g)||[]).length?";":",");
  const split=l=>{
    const out=[];let cur="",q=false;
    for(let i=0;i<l.length;i++){
      const c=l[i];
      if(q){ if(c==='"'){ if(l[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
      else if(c==='"')q=true;
      else if(c===delim){out.push(cur);cur="";}
      else cur+=c;
    }
    out.push(cur);return out.map(s=>s.trim());
  };
  /* Some exports carry preamble lines before the header; find the first row
     that actually names a Cq column rather than assuming it is row one. */
  let hi=-1,head=null;
  for(let i=0;i<Math.min(raw.length,30);i++){
    const cells=split(raw[i]);
    if(cells.some(c=>CQ_HEADERS.test(c))){hi=i;head=cells;break;}
  }
  if(hi<0)return {error:"No column named Cq, Ct, Cp or crossing point was found in the first 30 lines."};
  const iCq=head.findIndex(c=>CQ_HEADERS.test(c));
  let iSample=head.findIndex(c=>SAMPLE_HEADERS.test(c));
  const iWell=head.findIndex(c=>WELL_HEADERS.test(c));
  if(iSample<0)iSample=head.findIndex((c,j)=>j!==iCq&&j!==iWell&&c);
  if(iSample<0)return {error:"No sample-name column was found. The inhibition test needs it to group the dilutions."};
  const rows=[],skipped=[];
  for(let i=hi+1;i<raw.length;i++){
    const c=split(raw[i]);
    if(c.length<=iCq)continue;
    const v=Number(String(c[iCq]).replace(",","."));
    const sample=c[iSample]||"";
    if(!sample&&!Number.isFinite(v))continue;
    if(!Number.isFinite(v)||v<=0){skipped.push(`${sample||"row "+(i+1)}: "${c[iCq]}"`);continue;}
    if(rows.length>=APP_LIMITS.maxCqRows)return {error:`The pasted table has more than ${APP_LIMITS.maxCqRows.toLocaleString()} usable Cq rows.`};
    rows.push({well:iWell>=0?c[iWell]:"",sample,cq:v});
  }
  if(!rows.length)return {error:"A Cq column was found but no row carried a usable number."};
  return {rows,skipped,source,header:head[iCq],sampleCol:head[iSample]};
}
