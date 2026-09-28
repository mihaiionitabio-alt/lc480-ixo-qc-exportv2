function appStagedBytes(){try{return STAGED.reduce((a,x)=>a+((x&&x.bytes&&x.bytes.length)||0),0);}catch(e){return 0;}}
