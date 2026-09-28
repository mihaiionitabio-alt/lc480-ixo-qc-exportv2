function ccRemember(){if(!CC_STATE.remember)return;try{localStorage.setItem(CC_HIST_KEY,ccHistoryJSON(false));}catch(e){}}
