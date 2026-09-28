function ccCanonTarget(t){t=String(t||"").trim();const a=CC_TARGET_ALIAS.find(([re])=>re.test(t));return a?a[1]:t;}
