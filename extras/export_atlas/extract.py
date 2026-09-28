"""Run index.html headless, load a set of experiment files, and export every
image and table the page itself offers for download."""
import sys, os, json, base64, glob
from playwright.sync_api import sync_playwright

PAGE = "file:///mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/index.html"

def extract(files, outdir, only=None, timeout_s=240):
    os.makedirs(outdir, exist_ok=True)
    manifest = {"files": [os.path.basename(f) for f in files], "items": [], "errors": []}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium'
                              if os.path.exists('/opt/pw-browsers/chromium') else None,
                              args=["--js-flags=--max-old-space-size=4096"])
        pg = b.new_page(viewport={"width": 1600, "height": 1000})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(PAGE); pg.wait_for_timeout(1200)
        pg.set_input_files("#file", files); pg.wait_for_timeout(1500)
        pg.get_by_text("Read the files", exact=False).first.click()
        for _ in range(int(timeout_s * 2)):
            pg.wait_for_timeout(500)
            if pg.evaluate("typeof RUNS!=='undefined'?RUNS.length:0") >= len(files): break
        manifest["runs"] = pg.evaluate("RUNS.length")
        cat = pg.evaluate("""() => selCatalogue().map(x=>({id:x.id,kind:x.kind,group:x.group,
              title:x.title,note:x.note||'',ready:(()=>{try{return !!x.ready()}catch(e){return false}})()}))""")
        manifest["catalogue"] = cat
        for it in cat:
            if not it["ready"]: continue
            if only and it["id"] not in only: continue
            safe = it["id"].replace(":", "_").replace("/", "_")
            try:
                if it["kind"] == "image":
                    r = pg.evaluate("""async (id) => {
                        const it = selItem(id); const f = it.figure();
                        const jp = await svgToJpeg(f.svg, 2);
                        if (!jp) return {err:'raster failed'};
                        let bin=''; const a=jp.bytes; const C=0x8000;
                        for (let i=0;i<a.length;i+=C) bin += String.fromCharCode.apply(null, a.subarray(i,i+C));
                        return {b64: btoa(bin), w: jp.w, h: jp.h, rows: (f.rows||[]).length};
                    }""", it["id"])
                    if r.get("err"): raise RuntimeError(r["err"])
                    open(os.path.join(outdir, safe + ".jpg"), "wb").write(base64.b64decode(r["b64"]))
                    it.update(file=safe + ".jpg", w=r["w"], h=r["h"], rows=r["rows"])
                else:
                    t = pg.evaluate("(id)=>selItem(id).text()", it["id"])
                    open(os.path.join(outdir, safe + ".csv"), "w").write(t)
                    it.update(file=safe + ".csv", lines=t.count("\n"))
                manifest["items"].append(it)
            except Exception as e:
                manifest["errors"].append({"id": it["id"], "error": str(e)[:200]})
        manifest["pageErrors"] = errs[:5]
        b.close()
    json.dump(manifest, open(os.path.join(outdir, "manifest.json"), "w"), indent=1)
    return manifest

if __name__ == "__main__":
    out = sys.argv[1]
    files = []
    for a in sys.argv[2:]: files += sorted(glob.glob(a))
    m = extract(files, out)
    print(json.dumps({"runs": m.get("runs"), "catalogue": len(m["catalogue"]),
                      "exported": len(m["items"]), "errors": m["errors"][:6],
                      "pageErrors": m["pageErrors"]}, indent=1))
