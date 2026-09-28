function appStatusReport(){
  const d=appStatusSnapshot();
  return JSON.stringify({schema:"qpcr-status-report/1",written:new Date().toISOString(),
    page:{title:document.title,version:APP_VERSION,language:(typeof UI_LANG!=="undefined"?UI_LANG:"en")},
    status:d,renders:APP_STATS.renders,notices:APP_STATS.notices,faults:APP_STATE.errorLog},null,1);
}
