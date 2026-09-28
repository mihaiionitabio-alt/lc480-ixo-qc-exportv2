function wellToPos(text,cols){
  const m=String(text||"").trim().match(/^([A-Za-z])(\d{1,2})$/);
  return m?(m[1].toUpperCase().charCodeAt(0)-65)*cols+(parseInt(m[2],10)-1):null;
}
