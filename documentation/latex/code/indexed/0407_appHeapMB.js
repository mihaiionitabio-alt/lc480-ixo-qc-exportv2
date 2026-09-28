function appHeapMB(){try{const m=performance.memory;return m?m.usedJSHeapSize/1048576:NaN;}catch(e){return NaN;}}
