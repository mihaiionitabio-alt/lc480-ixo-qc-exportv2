function pdfWrap(text,width,size,bold){
  const words=String(text==null?"":text).split(/\s+/).filter(Boolean),lines=[];let cur="";
  words.forEach(w=>{
    const t=cur?cur+" "+w:w;
    if(pdfWidth(t,size,bold)<=width)cur=t;
    else{if(cur)lines.push(cur);cur=pdfWidth(w,size,bold)<=width?w:pdfFit(w,width,size,bold);}
  });
  if(cur)lines.push(cur);
  return lines.length?lines:[""];
}
