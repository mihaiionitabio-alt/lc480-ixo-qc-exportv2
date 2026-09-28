function renderExports(){
  /* Only what this experiment can actually produce. A disabled card for a
     format the file cannot supply reads as a broken feature rather than as an
     absent one, and invites the question "why not?" every time. What is missing
     is said once, plainly, underneath. */
  const items=exportCatalogue();
  const have=items.filter(it=>it.ready());
  const missing=items.filter(it=>!it.ready());
  /* Clear the previous note first: it lives outside #exports, so replacing that
     element's innerHTML does not remove it, and removing it afterwards would
     delete the one just written. */
  const prev=$("#exp-missing");if(prev)prev.remove();
  $("#exports").innerHTML=have.map(it=>{
    const i=items.indexOf(it);
    return `<div class="dl"><b>${esc(it.title)}</b><span>${esc(it.note)}</span>
      <button class="ghost" data-exp="${i}">Download</button></div>`;
  }).join("")
    +(have.length?"":`<div class="notice">Nothing loaded yet.</div>`);
  if(missing.length&&RUNS.length)
    $("#exports").insertAdjacentHTML("afterend",
      `<p class="hint" id="exp-missing">Not offered for this experiment, because it holds no such data:
        ${missing.map(m=>esc(m.title)).join(", ")}.</p>`);
  $$("#exports button[data-exp]").forEach(b=>b.onclick=()=>items[Number(b.dataset.exp)].run());

  const first=RUNS[0]?safeName(RUNS[0].meta.name||RUNS[0].file):"run";
  const r=rScript().replace("REPLACE_WIDE",`${first}_qpcR_curves.csv`).replace("REPLACE_CQ",baseName()+"_cq_values.csv");
  const p=pyScript().replace("REPLACE_RDML",`${first}.rdml`);
  $("#prev-r").textContent=r;
  $("#prev-py").textContent=p;
  $("#scripts").innerHTML=`
    <div class="dl"><b>analyse_with_qpcR.R</b><span>Fits every curve with qpcR, writes per-well efficiency and
      cpD2, and compares them with the Cq the instrument stored.</span>
      <button class="ghost" id="dl-r">Download R script</button></div>
    <div class="dl"><b>analyse_with_linregpcr.py</b><span>Runs LinRegPCR through rdmlpython on the exported RDML and
      writes the per-well efficiencies and starting concentrations.</span>
      <button class="ghost" id="dl-py">Download Python script</button></div>`;
  $("#dl-r").onclick=()=>download("analyse_with_qpcR.R",r,"text/plain");
  $("#dl-py").onclick=()=>download("analyse_with_linregpcr.py",p,"text/plain");
  renderDiagnostics();
}
