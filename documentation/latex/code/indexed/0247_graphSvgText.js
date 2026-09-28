function graphSvgText(){const L=GRAPH_STATE.last;if(!L)return "";
  return missyMarkWithSvg(L.res.svg,"top-right").replace("<svg ",`<svg data-sop="${esc(SOP.name)} v${esc(SOP.version)} sha256:${sopHash()}" `);}
