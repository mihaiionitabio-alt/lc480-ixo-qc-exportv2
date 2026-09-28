"""Load a group of experiment files into the page and dump the rows behind every
catalogue entry, so the numbers each figure and table plots can be measured."""
import sys, os, json, glob
from playwright.sync_api import sync_playwright
PAGE = "file:///mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/index.html"

def dump(files, outdir, timeout_s=600):
    os.makedirs(outdir, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium',
                              args=["--js-flags=--max-old-space-size=6144"])
        pg = b.new_page(viewport={"width": 1600, "height": 1000})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(PAGE); pg.wait_for_timeout(1500)
        pg.set_input_files("#file", files); pg.wait_for_timeout(2000)
        pg.get_by_text("Read the files", exact=False).first.click()
        for _ in range(timeout_s * 2):
            pg.wait_for_timeout(500)
            if pg.evaluate("typeof RUNS!=='undefined'?RUNS.length:0") >= len(files): break
        info = pg.evaluate("""() => ({runs: RUNS.length,
            names: RUNS.map(r=>r.file), platforms: [...new Set(RUNS.map(r=>r.platform||''))],
            wells: RUNS.reduce((n,r)=>n+((r.wells||[]).length),0)})""")
        out = {"files": [os.path.basename(f) for f in files], "info": info, "entries": {}, "errors": []}
        ids = pg.evaluate("() => selCatalogue().map(x=>x.id)")
        for i in ids:
            try:
                r = pg.evaluate("""(id) => {
                    const it = selItem(id);
                    let ready=false; try{ready=!!it.ready()}catch(e){}
                    if(!ready) return {ready:false};
                    if (it.kind === 'image') {
                        const f = it.figure();
                        return {ready:true, kind:'image', rows:(f.rows||[]).slice(0,4000)};
                    }
                    const t = it.text();
                    const lines = t.split(/\\r?\\n/).filter(Boolean);
                    const head = lines[0].split(',').map(s=>s.replace(/^"|"$/g,''));
                    const rows = lines.slice(1, 4001).map(l=>{
                        const o={}; let cur='',q=false,k=0;
                        const f=[]; for(let c=0;c<l.length;c++){const ch=l[c];
                          if(q){ if(ch==='"'){ if(l[c+1]==='"'){cur+='"';c++;} else q=false; } else cur+=ch; }
                          else if(ch==='"')q=true; else if(ch===','){f.push(cur);cur='';} else cur+=ch;}
                        f.push(cur);
                        head.forEach((h,j)=>o[h]=f[j]); return o;});
                    return {ready:true, kind:'data', rows};
                }""", i)
                out["entries"][i] = r
            except Exception as e:
                out["errors"].append({"id": i, "error": str(e)[:160]})
        out["pageErrors"] = errs[:6]
        b.close()
    json.dump(out, open(os.path.join(outdir, "rows.json"), "w"))
    return out

if __name__ == "__main__":
    out = sys.argv[1]; files = []
    for a in sys.argv[2:]: files += sorted(glob.glob(a))
    o = dump(files, out)
    rdy = sum(1 for v in o["entries"].values() if v.get("ready"))
    rows = sum(len(v.get("rows", [])) for v in o["entries"].values() if v.get("ready"))
    print(json.dumps({"files": len(files), "runs": o["info"]["runs"], "platforms": o["info"]["platforms"],
                      "wells": o["info"]["wells"], "ready": rdy, "rows": rows,
                      "errors": o["errors"][:3], "pageErrors": o["pageErrors"]}, indent=1))
