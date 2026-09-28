    return `<section class="ast-group"><h3>${esc(g)} <span class="ast-count">${items.length}</span>
      <button type="button" class="ghost ast-all" data-group="${esc(g)}">all</button>
      <button type="button" class="ghost ast-none" data-group="${esc(g)}">none</button></h3>
      <div class="ast-items">${items.map(x=>`<label class="ast-item${x.ready()?"":" ast-off"}">
        <input type="checkbox" data-id="${esc(x.id)}"${SEL_STATE.ids.has(x.id)?" checked":""}${x.ready()?"":" disabled"}>
        <span class="ast-title">${esc(x.title)}</span>
        <span class="ast-id">${esc(x.id)}</span>
        <span class="ast-note">${esc(x.ready()?(x.note||""):"not available until a file is read")}</span>
      </label>`).join("")}</div></section>`;
  }).join("");
  box.querySelectorAll("input[data-id]").forEach(cb=>cb.onchange=()=>{
