import json, os, glob, re, sys
from playwright.sync_api import sync_playwright
PAGE = "file:///mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/index.html"
files = sorted(glob.glob("/home/claude/eds/out/S23_*/S23_run*.eds"))[:20]
want = json.load(open("best.json"))
flat = [i for i, v in want.items() if v["item"]["kind"] == "image" and v["best"]["score"] < 0.3]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(); pg.goto(PAGE); pg.wait_for_timeout(1200)
    pg.set_input_files("#file", files); pg.wait_for_timeout(1500)
    pg.get_by_text("Read the files", exact=False).first.click()
    for _ in range(200):
        pg.wait_for_timeout(500)
        if pg.evaluate("typeof RUNS!=='undefined'?RUNS.length:0") >= len(files): break
    out = pg.evaluate("""(ids) => ids.map(id=>{
        try { const f = selItem(id).figure();
              const txt = (f.svg.match(/<text[^>]*>([^<]*)<\\/text>/g)||[])
                 .map(t=>t.replace(/<[^>]+>/g,'')).filter(Boolean);
              return {id, rows:(f.rows||[]).length, text: txt.slice(0,3), len:f.svg.length};
        } catch(e){ return {id, error:String(e).slice(0,120)}; }
    })""", flat)
    b.close()
json.dump(out, open("reasons.json", "w"), indent=1)
import collections
c = collections.Counter((o.get("text") or [o.get("error","?")])[0] for o in out)
for k, n in c.most_common(): print(f"{n:3d}  {k[:110]}")
