function pdfFit(text,width,size,bold){
  let s=String(text==null?"":text);
  if(pdfWidth(s,size,bold)<=width)return s;
  while(s.length&&pdfWidth(s+"…",size,bold)>width)s=s.slice(0,-1);
  return s+"…";
}
