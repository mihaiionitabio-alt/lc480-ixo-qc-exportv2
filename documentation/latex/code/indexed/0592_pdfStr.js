function pdfStr(s){
  let o="";
  for(const ch of String(s==null?"":s)){
    const sp=PDF_SPELL[ch];
    if(sp!==undefined){o+=pdfStr(sp);continue;}
    const win=PDF_WINANSI[ch];
    const c=win!==undefined?win:ch.codePointAt(0);
    if(ch==="("||ch===")"||ch==="\\")o+="\\"+ch;
    else if(c===10)o+="\\n";
    else if(c<32)o+=" ";
    else if(c<128)o+=String.fromCharCode(c);
    else if(c<256)o+="\\"+c.toString(8).padStart(3,"0");
    else o+="?";
  }
  return o;
}
