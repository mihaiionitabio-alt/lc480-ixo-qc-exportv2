function appTaskStep(t,done,detail){if(!t)return;t.done=done==null?t.done+1:done;if(detail)t.detail=String(detail);}
