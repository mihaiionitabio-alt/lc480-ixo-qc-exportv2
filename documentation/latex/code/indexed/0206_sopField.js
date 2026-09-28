function sopField(label,path,type,opts,hint){
  const v=path.split(".").reduce((o,k)=>o==null?o:o[k],SOP);
  const id="sopf-"+path.replace(/\./g,"-");
  let input;
  if(type==="select")input=`<select id="${id}" data-sop-path="${path}">${opts.map(o=>`<option value="${esc(o)}"${String(v)===String(o)?" selected":""}>${esc(SOP_ACTION_LABEL[o]||o)}</option>`).join("")}</select>`;
  else if(type==="check")input=`<input id="${id}" type="checkbox" data-sop-path="${path}" style="width:auto"${v?" checked":""}>`;
  else if(type==="area")input=`<textarea id="${id}" data-sop-path="${path}" style="min-height:60px">${esc(v??"")}</textarea>`;
  else input=`<input id="${id}" type="${type==="number"?"number":"text"}" step="any" data-sop-path="${path}" value="${esc(v??"")}">`;
  return `<label class="sop-field"><span>${esc(label)}</span>${input}${hint?`<small class="hint">${esc(hint)}</small>`:""}</label>`;
}
