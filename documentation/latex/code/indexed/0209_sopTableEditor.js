function sopTableEditor(box,rows,cols,addLabel,blank){
  const locked=!!SOP.locked;
  const head=cols.map(c=>`<th>${esc(c.label)}</th>`).join("")+(locked?"":"<th></th>");
  const body=rows.map((r,i)=>"<tr>"+cols.map(c=>{
    const v=r[c.key]??"";
    const dis=locked?" disabled":"";
    if(c.type==="select")return `<td><select data-i="${i}" data-k="${c.key}"${dis}>${c.options.map(o=>`<option value="${esc(o)}"${String(v)===String(o)?" selected":""}>${esc(SOP_ACTION_LABEL[o]||o)}</option>`).join("")}</select></td>`;
    if(c.type==="color")return `<td><input type="color" data-i="${i}" data-k="${c.key}" value="${esc(v||"#94a3b8")}"${dis} style="width:46px;padding:0;height:28px"></td>`;
    if(c.type==="static")return `<td>${esc(v)}</td>`;
    return `<td><input type="${c.type==="number"?"number":"text"}" step="any" data-i="${i}" data-k="${c.key}" value="${esc(v)}"${dis} style="min-width:${c.w||80}px"></td>`;
  }).join("")+(locked?"":`<td><button class="ghost sop-del" data-i="${i}" type="button" title="Remove row">✕</button></td>`)+"</tr>").join("");
  box.innerHTML=`<div class="scroll" style="max-height:320px"><table class="sop-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
    +(locked||!addLabel?"":`<button class="ghost sop-add" type="button" style="margin-top:6px">${esc(addLabel)}</button>`);
  box.querySelectorAll("[data-k]").forEach(el=>{el.onchange=()=>{
    const c=cols.find(x=>x.key===el.dataset.k),r=rows[Number(el.dataset.i)];
    r[c.key]=c.type==="number"?(el.value===""?"":Number(el.value)):el.value;sopProfileEdited();};});
  box.querySelectorAll(".sop-del").forEach(b=>b.onclick=()=>{rows.splice(Number(b.dataset.i),1);sopProfileEdited(true);});
  const add=box.querySelector(".sop-add");if(add)add.onclick=()=>{rows.push(blank());sopProfileEdited(true);};
}
