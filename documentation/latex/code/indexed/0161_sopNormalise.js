function sopNormalise(p){
  if(p&&p.schema==="qpcr-control-mapping-proposal/v1"){
    /* The review proposal intentionally has a different schema.  Opening it
       converts its reviewed SC-06 rules to the application profile shape;
       stored run values and calls remain untouched. */
    const q=SOP_PRESETS.sc();q.name="SC screening — SOP-06 laboratory default";q.version="1.0";return q;
  }
  const b=sopBase();if(!p||typeof p!=="object")return b;
  const o=Object.assign({},b,p);
  ["replicates","ic","run","graphs"].forEach(k=>o[k]=Object.assign({},b[k],p[k]||{}));
  o.outcomes={};SOP_OUTCOMES.forEach(k=>o.outcomes[k]=Object.assign({},SOP_OUTCOME_DEFAULTS[k],(p.outcomes||{})[k]||{}));
  o.targets=Array.isArray(p.targets)&&p.targets.length?p.targets.map(t=>Object.assign({match:"*",kind:"auto",cqMax:40,cqLate:"",quantMin:"",lateOutcome:"Inconclusive"},t)):b.targets;
  o.controls=Array.isArray(p.controls)?p.controls.map(c=>Object.assign({name:"",matchBy:"name",match:"",expect:"negative",cqLo:"",cqHi:"",targets:"*",minPerRun:0,onFail:"reject"},c)):b.controls;
  o.schema=SOP_SCHEMA;delete o.sha256;return o;
}
