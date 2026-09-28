function metricCard(value,label,cls){
  return `<div class="metric ${cls||""}"><b>${esc(value)}</b><span>${esc(ui(label))}</span></div>`;
}
