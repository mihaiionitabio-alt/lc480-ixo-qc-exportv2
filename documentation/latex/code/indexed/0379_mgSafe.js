function mgSafe(f,fallback){try{return f();}catch(e){appError("console:view",e);return fallback;}}
