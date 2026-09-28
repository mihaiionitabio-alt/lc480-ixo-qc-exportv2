const argb=v=>{const n=parseInt(v,10);if(!Number.isFinite(n))return null;const u=n>>>0;return `rgb(${(u>>16)&255},${(u>>8)&255},${u&255})`};
