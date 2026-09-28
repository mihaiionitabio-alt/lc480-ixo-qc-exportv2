function pdfWidth(text,size,bold){
  /* Helvetica advance widths, 1000 units per em, for the printable range.
     Approximated by class: the report only needs column fitting, not kerning. */
  const s=String(text==null?"":text);let w=0;
  for(const ch of s){
    const c=ch.codePointAt(0);
    let u=556;
    if("iljI|!.,;:'`".includes(ch))u=222;
    else if("ftr()[]{}/\\-".includes(ch))u=333;
    else if(" ".includes(ch))u=278;
    else if("0123456789".includes(ch))u=556;
    else if("mwMW@".includes(ch))u=833;
    else if(c>=65&&c<=90)u=667;
    else if(c>=97&&c<=122)u=556;
    w+=u*(bold?1.06:1);
  }
  return w*size/1000;
}
