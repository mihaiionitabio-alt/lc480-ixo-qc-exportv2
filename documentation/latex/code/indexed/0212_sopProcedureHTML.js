function sopProcedureHTML(){
  const m=SOP.method||{},a=m.applies_when||{},p=SOP.procedure||{},i=SOP.interpretation||{};
  const arr=v=>Array.isArray(v)?v:[];
  const steps=arr(p.steps).map(x=>`<li><b>${esc(x.id||"")} ${esc(x.title||"")}</b><br>${esc(x.instruction||"")}<br><span class="hint">Acceptance: ${esc(x.acceptance||"")}</span></li>`).join("");
  const rules=arr(i.rules).map(x=>`<li><b>${esc(x.id||"")}</b> — when ${esc(x.when||"")}; <b>action:</b> ${esc(x.action||"")}; <b>outcome:</b> ${esc(x.outcome||"")}</li>`).join("");
  const principles=arr(i.principles).map(x=>`<li>${esc(x)}</li>`).join("");
  const platforms=arr(a.platforms).join(", ")||"any";
  return `<details class="sop-sec" open><summary>0 · Method, procedure and interpretation</summary>
    <div class="sop-grid"><div><b>Method</b><br>${esc(m.id||SOP.assay||"unspecified")} · revision ${esc(m.revision||SOP.version||"")}</div>
    <div><b>Scope</b><br>${esc(m.scope||"laboratory profile")}</div>
    <div><b>Applicable platforms</b><br>${esc(platforms)}</div>
    <div><b>Run-name rule</b><br><code>${esc(a.run_name_pattern||"none")}</code></div></div>
    <p class="hint">The method block controls applicability. A run outside this scope is reported as <b>Profile not applicable</b>; its stored Cq values, calls and curves remain available.</p>
    ${p.purpose?`<p><b>Purpose:</b> ${esc(p.purpose)}</p>`:""}
    ${steps?`<h4>Procedure</h4><ol>${steps}</ol>`:""}
    ${principles?`<h4>Interpretation principles</h4><ul>${principles}</ul>`:""}
    ${rules?`<h4>Decision rules</h4><ul>${rules}</ul>`:""}
    ${i.reporting?`<p class="hint"><b>Reporting:</b> rule ID ${i.reporting.include_rule_id!==false?"included":"optional"}; reason ${i.reporting.include_reason!==false?"included":"optional"}; stored call ${i.reporting.include_stored_call!==false?"included":"optional"}.</p>`:""}
  </details>`;
}
