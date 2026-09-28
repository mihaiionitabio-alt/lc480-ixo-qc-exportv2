function table(cols,rows,opts){
  const o=opts||{};
  const head=cols.map(c=>`<th class="${c.n?"n":""}">${esc(ui(c.label))}</th>`).join("");
  const body=rows.map(r=>"<tr>"+cols.map(c=>{
    const v=r[c.key];
    return `<td class="${c.n?"n":""}">${c.html?(v==null?"":v):esc(v==null?"":v)}</td>`;
  }).join("")+"</tr>").join("");
  return `<table>${o.nohead?"":`<thead><tr>${head}</tr></thead>`}<tbody>${body}</tbody></table>`;
}
