function sopControlSpec(w){
  return SOP.controls.find(c=>{
    const hay=c.matchBy==="role"?(w.role||""):(w.sample||"");
    return c.match&&sopMatcher(c.match)(hay)&&sopMatcher(c.targets||"*")(w.target||w.analysis||"");
  })||null;
}
