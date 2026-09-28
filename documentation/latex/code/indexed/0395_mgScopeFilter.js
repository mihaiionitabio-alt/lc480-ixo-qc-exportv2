function mgScopeFilter(all){
  const v=MG_VIEWS[MG.scope];if(!v)return all;
  let items=[];try{items=v.build()||[];}catch(e){appError("console:view",e);items=[];}
  if(!items.length)items=all;
  return items;
}
