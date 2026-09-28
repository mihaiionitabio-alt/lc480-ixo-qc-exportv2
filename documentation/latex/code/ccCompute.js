function ccCompute(def,rows,variant){
  const cfg=ccCfg(def.id),type=cfg.type||def.type,platform=rows[0]?rows[0].platform:"LC";
  const all=rows.filter(r=>ccValue(def,r,variant)!==undefined);
  const Xall=ccXAxis(def,cfg,all),spec=ccSpec(def,cfg,platform,all,variant);
  /* re-baseline: Phase I starts at the first run on or after cfg.baseFrom; earlier runs are drawn grey, without limits or alarms */
  const t0=cfg.baseFrom?Date.parse(cfg.baseFrom):NaN;let s0=0;
  if(Number.isFinite(t0)){s0=all.findIndex(r=>(r.date||0)>=t0);if(s0<0)s0=all.length;}
  const keep=all.slice(s0),X={kind:Xall.kind,label:Xall.label,x:Xall.x.slice(s0)};
  cfg.res=def.res?(def.res[platform]||0):0;
  let res;
  if(type==="funnel"){const fr=rows.map(r=>({...r,m:{...r.m,[def.metric||def.id]:ccValue(def,r,variant)}}));res=ccFunnel(fr,def.metric||def.id);res.nRows=fr.filter(r=>r.m[def.metric||def.id]&&r.m[def.metric||def.id].n>0).length;}
  else if(type==="p"){const v=keep.map(r=>ccValue(def,r,variant));res=ccP(v.map(o=>o.bad),v.map(o=>o.n),cfg);}
  else if(type==="u"){const v=keep.map(r=>ccValue(def,r,variant));res=ccU(v.map(o=>o.count),v.map(o=>o.exposure),cfg);}
  else if(type==="c"){res=ccC(keep.map(r=>ccValue(def,r,variant).count),cfg);}
  else if(type==="xbars"){res=ccXbarS(keep.map(r=>ccValue(def,r,variant)),cfg);}
  else{
    const y=keep.map(r=>{const v=ccValue(def,r,variant);return typeof v==="object"&&v?v.mean:Number(v);});
    const one=(yy,xx)=>{const r=type==="trend"?ccTrend(xx,yy,cfg,spec):type==="ewma"?ccEWMA(yy,cfg):type==="cusum"?ccCUSUM(yy,cfg):ccI(yy,cfg);
      if(def.westgard&&type==="i")ccWestgard(r);return r;};
    /* control materials: each extract gets its own baseline and limits (a new extract is a new process) */
    const seg=def.segmentBy==="batch"?keep.map(r=>((r.m.pc_batch||{})[variant])||"extract not recorded"):null;
    if(seg&&new Set(seg).size>1){
      /* extracts can alternate on the same instrument: each extract is charted on its own runs (in date order),
         with its own baseline, and the points are put back in run order */
      const groups=[];seg.forEach((k,i)=>{let g=groups.find(q=>q.key===k);if(!g){g={key:k,idx:[]};groups.push(g);}g.idx.push(i);});
      res={pts:new Array(y.length),segments:[],segmented:true};const lastKey=seg[seg.length-1];
      groups.forEach(g=>{const yy=g.idx.map(i=>y[i]),xx=g.idx.map(i=>X.x[i]),r=one(yy,xx),nn=yy.filter(Number.isFinite).length,ready=nn>=ccBaselineNeed(cfg);
        if(!ready){r.pts.forEach(p=>{p.flags=[];p.cl=p.ucl=p.lcl=NaN;});delete r.reach;}
        r.pts.forEach((p,j)=>{p.segment=g.key;res.pts[g.idx[j]]=p;});res.segments.push({key:g.key,x:X.x[g.idx[0]],n:nn,ready,last:g.key===lastKey});
        if(g.key===lastKey){res.cl=r.cl;res.sigma=r.sigma;res.slope=r.slope;res.intercept=r.intercept;if(r.reach)res.reach=r.reach;}});
    }else{res=one(y,X.x);if(seg)res.pts.forEach(p=>{p.segment=seg[0];});if(seg)res.segments=[{key:seg[0],x:X.x[0],n:y.filter(Number.isFinite).length,ready:true}];}
  }
  const eligible=res.pts.filter(p=>Number.isFinite(p.raw!==undefined?p.raw:p.y)).length;
  const cohortOK=new Set(keep.map(r=>`${r.instrument}|${r.protocol||"unknown"}|${r.firmware||""}`)).size<=1;
  res.baselineReady=(res.segmented?res.segments.some(g=>g.ready):eligible>=ccBaselineNeed(cfg))&&cohortOK;res.cohortOK=cohortOK;
  if(type!=="funnel"&&!res.baselineReady){res.pts.forEach(p=>{p.flags=[];p.cl=p.ucl=p.lcl=p.sUcl=NaN;});delete res.reach;}
  if(type!=="funnel")res.pts.forEach((p,i)=>{p.row=keep[i];p.x=X.x[i];
    const raw=p.raw!==undefined?p.raw:p.y;
    if(Number.isFinite(spec.lo)&&raw<spec.lo)p.flags=p.flags.concat("below specification");
    if(Number.isFinite(spec.hi)&&raw>spec.hi)p.flags=p.flags.concat("above specification");});
  if(type!=="funnel"&&s0>0){
    const pre=all.slice(0,s0).map((r,i)=>{const v=ccValue(def,r,variant);let y=NaN,s;
      if(type==="i"||type==="trend")y=typeof v==="object"&&v?v.mean:Number(v);
      else if(type==="xbars"&&v){y=v.mean;s=v.sd;}
      else if(type==="p"&&v&&v.n)y=v.bad/v.n;else if(type==="u"&&v&&v.exposure)y=v.count/v.exposure;else if(type==="c"&&v)y=v.count;
      return {y,s,raw:y,cl:NaN,ucl:NaN,lcl:NaN,flags:[],pre:true,row:r,x:Xall.x[i]};});
    res.pts=pre.concat(res.pts);res.baseX=Xall.x[s0];
  }
  Object.assign(res,{type,cfg,X:Xall,spec,n:all.length,nBase:keep.length,s0,def,variant});
  res.shift=ccShift(res);return res;
}