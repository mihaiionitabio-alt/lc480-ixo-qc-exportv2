function safeName(s){return String(s||"artifact").replace(/[^\w.-]+/g,"_").replace(/^_+|_+$/g,"")||"artifact";}
