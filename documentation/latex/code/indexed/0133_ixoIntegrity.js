function ixoIntegrity(bytes){
  if(!bytes||!bytes.length)return null;
  const needle=textEncoder.encode("</objectstream>");let at=-1;
  outer:for(let i=bytes.length-needle.length;i>=Math.max(0,bytes.length-4096);i--){
    for(let k=0;k<needle.length;k++)if(bytes[i+k]!==needle[k])continue outer;
    at=i;break;
  }
  if(at<0)return {kind:"ixo",stored:"",computed:"",ok:null,note:"no </objectstream> near the end of the file"};
  let end=at+needle.length;if(bytes[end]===13&&bytes[end+1]===10)end+=2;
  const stored=new TextDecoder().decode(bytes.subarray(end)).trim().toUpperCase();
  const m=EDS.MD5();m.update(bytes.subarray(0,end));const h=m.digest();
  const computed="$"+[0,8,16,24].map(i=>h.slice(i,i+8).match(/../g).reverse().join("").toUpperCase()).join("-");
  return {kind:"ixo",stored,computed,ok:stored?stored===computed:null,
    note:stored?"":"no checksum line after </objectstream>"};
}
