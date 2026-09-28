function renderSopHeader(){
  const h=$("#sop-head");if(!h)return;
  const hash=sopHash();
  h.innerHTML=`<div class="kv"><b>Profile</b><span>${esc(SOP.name)} · version ${esc(SOP.version)}${SOP.author?` · ${esc(SOP.author)}`:""}</span>
    <b>Laboratory</b><span>${esc(sopLabName()||"not stated")}${sopAnalystName()?` · analysis by ${esc(sopAnalystName())}`:""}</span>
    <b>SHA-256</b><span><code style="font-size:11.5px">${hash}</code></span>
    <b>State</b><span>${SOP.reviewOnly?tag("warn","review-only; no release decision"):SOP.locked?tag("ok","locked — fields are read-only"):tag("warn","editable")}</span></div>`;
  $("#sop-lock").checked=!!SOP.locked;
}
