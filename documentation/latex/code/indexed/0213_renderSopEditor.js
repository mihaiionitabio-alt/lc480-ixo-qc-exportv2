function renderSopEditor(){
  const box=$("#sop-editor");if(!box)return;
  const L=!!SOP.locked;
  const R="run.",A=["reject","review","off"];
  box.innerHTML=`
  ${sopProcedureHTML()}
  <details class="sop-sec" open><summary>1 · Identity of the procedure</summary><div class="sop-grid">
    ${sopField("Profile name","name")}${sopField("Version","version")}${sopField("Author / approver","author")}
    ${sopField("Laboratory","lab.name",null,null,"named on every report this page builds")}${sopField("Analysis by","lab.analyst",null,null,"the person doing the analysis")}
    ${sopField("Assay","assay")}${sopField("Effective from","effective")}${sopField("Notes","notes","area")}</div></details>
  <details class="sop-sec" open><summary>2 · Targets, Cq cut-offs and late-signal zone</summary>
    <p class="hint">Rows are tried top to bottom; the first whose pattern matches the target name applies. Patterns: <code>35S|P35S</code>, wildcards <code>HMG*</code>, <code>*</code> for anything, or a regular expression written as <code>/^tNOS/</code>. A Cq above the cut-off counts as not detected. A mean Cq above the late-signal limit, or a quantity below the minimum, gets the late-signal outcome.</p>
    <div id="sop-targets"></div>
    ${L?"":`<button class="ghost" id="sop-add-found" type="button">Add a row for every target in the loaded runs</button>`}</details>
  <details class="sop-sec"><summary>3 · Controls: which wells, what they must show, how many per run</summary>
    <p class="hint">Match by the sample name (patterns as above) or by the resolved role (NTC, Blank, Negative control, Positive control, Calibrator, Standard). Leave the Cq range empty when any detection is acceptable.</p>
    <div id="sop-controls"></div></details>
  <details class="sop-sec"><summary>4 · Replicates and internal control</summary><div class="sop-grid">
    ${sopField("Minimum replicates per sample","replicates.min","number")}
    ${sopField("Detected replicates needed for a positive","replicates.positiveMin","number","capped at the number of replicates present")}
    ${sopField("Outcome when only some replicates are detected","replicates.partialOutcome","select",SOP_OUTCOME_OPTIONS.slice(0,5))}
    ${sopField("Maximum replicate SD (Cq)","replicates.maxSd","number")}
    ${sopField("Outcome when the SD is exceeded","replicates.sdOutcome","select",SOP_OUTCOME_OPTIONS)}
    ${sopField("Fixed IC reference Cq (longitudinal monitoring)","ic.referenceCq","number")}
    ${sopField("Maximum IC shift from the run median (cycles)","ic.maxShift","number")}
    ${sopField("Outcome for a negative with a shifted IC","ic.shiftOutcome","select",SOP_OUTCOME_OPTIONS.slice(0,5))}
    ${sopField("Outcome when the IC / reference is not detected","ic.missingOutcome","select",SOP_OUTCOME_OPTIONS.slice(0,5))}
  </div></details>
  <details class="sop-sec"><summary>5 · Run acceptance</summary><div class="sop-grid">
    ${sopField("Container checksum fails",R+"integrity","select",A)}
    ${sopField("Run not completed",R+"runState","select",A)}
    ${sopField("Required control missing",R+"controlsMissing","select",A)}
    ${sopField("Standard curve outside limits",R+"stdCurve","select",A)}
    ${sopField("Minimum R²",R+"minR2","number")}${sopField("Efficiency from (%)",R+"effMin","number")}${sopField("Efficiency to (%)",R+"effMax","number")}
    ${sopField("Minimum dynamic range (log10)",R+"minLogs","number")}
    ${sopField("Minimum NTC-to-sample gap (cycles)",R+"ntcGap","number")}${sopField("NTC gap too small",R+"ntcGapAction","select",A)}
    ${sopField("Maximum hours from run end to last change",R+"editDelayHours","number")}${sopField("Changed later / created after run",R+"editAction","select",A)}
    ${sopField("Calibration expired (QuantStudio)",R+"calibration","select",A)}
    ${sopField("Maximum block zone spread °C (QuantStudio)",R+"maxZoneSpread","number")}${sopField("Zone spread exceeded",R+"zoneAction","select",A)}
    ${sopField("A rejected run turns every sample result into “Invalid run”",R+"invalidRunOverrides","check")}
  </div></details>
  <details class="sop-sec"><summary>6 · Outcomes, colours and report wording</summary>
    <p class="hint">Placeholders: {sample} {target} {cq} {sd} {det} {n} {cutoff} {reason} {outcome} {run}. The colours are used by every SOP graph.</p>
    <div id="sop-outcomes"></div></details>
  <details class="sop-sec"><summary>7 · Graph settings</summary><div class="sop-grid">
    ${sopField("Draw the Cq cut-off lines","graphs.showCutoffs","check")}${sopField("Draw the late-signal lines","graphs.showLate","check")}
    ${sopField("Draw the SD limit","graphs.showSdLimit","check")}</div></details>
  <details class="sop-sec"><summary>8 · Control charts</summary>
    <p class="hint">Each control chart is configured on its own page in the Control panel (chart type, baseline runs, specification limits, run rules, alarm action). Those settings are stored in this profile under "controlCharts" and change its SHA-256. Customised charts: ${Object.keys(SOP.controlCharts||{}).length ? esc(Object.keys(SOP.controlCharts).map(k=>(CC_BY_ID[k]||{}).code||k).join(", ")) : "none (defaults)"}.</p>
    <button class="ghost" type="button" onclick="showTab('panel')">Open the control panel</button></details>
  <details class="sop-sec"><summary>Edit the profile as JSON</summary>
    <textarea id="sop-json" style="min-height:220px;font-family:ui-monospace,monospace;font-size:12px"${L?" readonly":""}></textarea>
    ${L?"":`<button class="ghost" id="sop-json-apply" type="button">Apply JSON</button>`}<span id="sop-json-msg" class="hint"></span></details>`;
  box.querySelectorAll("[data-sop-path]").forEach(el=>{
    if(L)el.disabled=true;
    el.onchange=()=>{const t=el.type;sopSetPath(el.dataset.sopPath,t==="checkbox"?el.checked:t==="number"?(el.value===""?"":Number(el.value)):el.value);sopProfileEdited();};
  });
  sopTableEditor($("#sop-targets"),SOP.targets,[
    {key:"match",label:"Target pattern",w:150},{key:"kind",label:"Kind",type:"select",options:["auto","target","reference","ic"]},
    {key:"cqMax",label:"Cq cut-off",type:"number",w:70},{key:"cqLate",label:"Late-signal limit",type:"number",w:70},
    {key:"quantMin",label:"Minimum quantity",type:"number",w:80},
    {key:"lateOutcome",label:"Late / low outcome",type:"select",options:["Inconclusive","Repeat","Positive"]}],
    "Add target rule",()=>({match:"",kind:"target",cqMax:40,cqLate:"",quantMin:"",lateOutcome:"Inconclusive"}));
  sopTableEditor($("#sop-controls"),SOP.controls,[
    {key:"name",label:"Control",w:120},{key:"matchBy",label:"Match by",type:"select",options:["name","role"]},
    {key:"match",label:"Pattern",w:140},{key:"targets",label:"Targets",w:70},
    {key:"expect",label:"Expectation",type:"select",options:["negative","positive","standard"]},
    {key:"cqLo",label:"Cq from",type:"number",w:60},{key:"cqHi",label:"Cq to",type:"number",w:60},
    {key:"minPerRun",label:"Min wells / run",type:"number",w:55},
    {key:"minReplicates",label:"Min replicates / control",type:"number",w:65},
    {key:"purpose",label:"Purpose",w:120},{key:"material",label:"Material",w:100},
    {key:"onFail",label:"If it fails",type:"select",options:["reject","review","off"]}],
    "Add control",()=>({name:"",matchBy:"name",match:"",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:1,onFail:"reject"}));
  const orows=SOP_OUTCOMES.map(k=>Object.assign({outcome:k},SOP.outcomes[k]));
  sopTableEditor($("#sop-outcomes"),orows,[{key:"outcome",label:"Outcome",type:"static"},{key:"label",label:"Label in reports",w:120},
    {key:"colour",label:"Colour",type:"color"},{key:"text",label:"Report sentence",w:360}],null,null);
  $("#sop-outcomes").querySelectorAll("[data-k]").forEach(el=>{const prev=el.onchange;el.onchange=()=>{
    const r=orows[Number(el.dataset.i)];r[el.dataset.k]=el.value;SOP.outcomes[r.outcome][el.dataset.k]=el.value;sopProfileEdited();};});
  $("#sop-json").value=sopJSON();
  const ap=$("#sop-json-apply");if(ap)ap.onclick=()=>{try{SOP=sopNormalise(JSON.parse($("#sop-json").value));$("#sop-json-msg").textContent="";sopProfileEdited(true);}
    catch(e){$("#sop-json-msg").textContent="Not valid JSON: "+e.message;}};
  const af=$("#sop-add-found");if(af)af.onclick=()=>{
    const have=new Set(SOP.targets.map(t=>t.match));
    const found=uniq(RUNS.flatMap(r=>(r.wells||[]).map(w=>w.target||"")).filter(Boolean)).filter(t=>!have.has(t));
    const star=SOP.targets.findIndex(t=>t.match==="*"||t.match==="");
    const rows=found.map(t=>{const w=RUNS.flatMap(r=>r.wells).find(x=>x.target===t)||{};const s=sopTargetSpec(w);
      return {match:t,kind:s.kind,cqMax:s.cqMax??40,cqLate:s.cqLate??"",quantMin:s.quantMin??"",lateOutcome:s.lateOutcome||"Inconclusive"};});
    SOP.targets.splice(star<0?SOP.targets.length:star,0,...rows);sopProfileEdited(true);
  };
  localizeDOM(box);
}
