function appTaskWrap(names){names.forEach(n=>{const f=window[n];if(typeof f!=="function"||f.__wrapped)return;
  const w=async function(...a){const t=appTaskStart(APP_TASK_LABEL[n]||n,0,false);try{return await f.apply(this,a);}
    catch(e){appError("task:"+n,e);throw e;}finally{appTaskEnd(t);}};
  w.__wrapped=true;window[n]=w;});}
