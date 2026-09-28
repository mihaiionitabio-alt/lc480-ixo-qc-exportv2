function sopLoadStored(){try{const t=localStorage.getItem("qpcr_sop_profile");return t?sopNormalise(JSON.parse(t)):null;}catch(e){return null;}}
