function renderControlCategoryEditor(){
  const box=$("#control-category-table");if(!box)return;
  const roots=detectedControlRoots();
  if(!roots.length){box.innerHTML='<p class="hint">No control roots detected.</p>';return;}
  const options=(r)=>{
    const values=uniq([r.automaticCategory,...CONTROL_CATEGORY_OPTIONS]);
    return `<option value="auto"${r.override?"":" selected"}>${esc(ui(`Automatic — ${r.automaticCategory}`))}</option>`
      +values.map(v=>`<option value="${esc(v)}"${r.override===v?" selected":""}>${esc(ui(v))}</option>`).join("")
      +`<option value="ignore"${r.override==="ignore"?" selected":""}>${esc(ui("Ignore / not a control"))}</option>`;
  };
  box.innerHTML=`<div class="scroll"><table><thead><tr><th>${esc(ui("Root name"))}</th><th>${esc(ui("Names found"))}</th>
    <th>${esc(ui("Automatic category"))}</th><th>${esc(ui("Use as"))}</th></tr></thead><tbody>${roots.map(r=>`<tr>
      <td><b>${esc(r.root)}</b></td><td>${esc(r.variants.join(", "))}</td>
      <td>${esc(ui(r.automaticCategory))}</td><td><select data-control-root="${esc(r.key)}"
        aria-label="${esc(ui(`Category for ${r.root}`))}">${options(r)}</select></td></tr>`).join("")}
    </tbody></table></div>`;
  $$("#control-category-table select[data-control-root]").forEach(select=>{
    select.onchange=()=>{
      const key=select.dataset.controlRoot,value=select.value;
      if(value==="auto")delete REVIEW_STATE.controlCategoryOverrides[key];
      else REVIEW_STATE.controlCategoryOverrides[key]=value;
      renderReviewControls();
    };
  });
}
