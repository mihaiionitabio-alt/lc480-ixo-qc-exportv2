function ccProtocolKey(run){
  const segs=((run.protocol||{}).programs||[]).flatMap(p=>(p.segments||[]).map(s=>`${+s.target}/${+s.hold||0}s${s.slope?"@"+(+s.slope):""}`));
  return segs.join(" ")||"(protocol not decoded)";
}