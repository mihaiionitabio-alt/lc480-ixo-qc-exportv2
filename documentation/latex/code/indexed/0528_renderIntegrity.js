function renderIntegrity(){
  const box=$("#integrity-summary"),list=$("#integrity-list");if(!box||!list)return;
  const rows=integrityMismatches();
  box.innerHTML=RUNS.length
    ? `<div class="notice ${rows.length?"bad":"ok"}"><b>${rows.length?rows.length+" file-integrity mismatch(es) found":"No file-integrity mismatches detected"}.</b> ${RUNS.length} file(s) examined.</div>`
    : `<div class="notice">Load experiment files to check their integrity.</div>`;
  list.innerHTML=rows.length?`<ol class="integrity-records">${rows.map((r,i)=>
    `<li class="integrity-record"><div class="integrity-record-head">
       <span class="integrity-index">${i+1}</span>
       <b class="integrity-file" title="${esc(r.file)}">${esc(r.file)}</b>
       <span class="integrity-badge">file integrity</span></div>
     <dl class="integrity-fields">
       <div><dt>Check</dt><dd>${esc(r.type)}</dd></div>
       <div><dt>Expected</dt><dd class="integrity-value">${esc(r.expected)}</dd></div>
       <div><dt>Observed</dt><dd class="integrity-value">${esc(r.actual)}</dd></div>
       <div><dt>Meaning</dt><dd>${esc(r.detail)}</dd></div>
     </dl></li>`).join("")}</ol>`
    : `<p class="hint">Mismatches will appear here one under another when a file fails a stored checksum or archive-integrity comparison.</p>`;
  const b=$("#dl-integrity");if(b)b.onclick=()=>{
    if(!rows.length)return;
    download(baseName()+"_file_integrity.csv","file,check,expected,observed,meaning\n"+rows.map(r=>[r.file,r.type,r.expected,r.actual,r.detail].map(csvq).join(",")).join("\n")+"\n","text/csv");
  };
}
