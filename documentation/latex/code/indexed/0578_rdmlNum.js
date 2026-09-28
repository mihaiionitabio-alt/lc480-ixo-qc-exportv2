function rdmlNum(el,name){
  const t=rdmlText(el,name);if(t==="")return null;
  const n=Number(t);return Number.isFinite(n)?n:null;          /* "1.0" is a cycle, not an integer */
}
