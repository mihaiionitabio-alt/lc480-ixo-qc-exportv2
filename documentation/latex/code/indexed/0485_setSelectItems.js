function setSelectItems(sel,items,keep){
  if(!sel)return "";
  const old=keep==null?sel.value:keep;
  sel.innerHTML=items.map(x=>`<option value="${esc(x.value)}">${esc(ui(x.label))}</option>`).join("");
  const values=items.map(x=>String(x.value));
  sel.value=values.includes(String(old))?String(old):(values[0]||"");
  return sel.value;
}
