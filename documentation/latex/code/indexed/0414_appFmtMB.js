function appFmtMB(mb){return !isFinite(mb)?"—":(mb>=1024?(mb/1024).toFixed(2)+" GB":mb.toFixed(mb<10?1:0)+" MB");}
