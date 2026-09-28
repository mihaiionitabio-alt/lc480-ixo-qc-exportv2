function shortDate(value){
  const m=String(value||"").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m?`${Number(m[3])}.${Number(m[2])}`:"";
}
