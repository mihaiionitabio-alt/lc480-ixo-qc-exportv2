import json
from playwright.sync_api import sync_playwright
PAGE = "file:///mnt/user-data/uploads/IXO/release_unified_2026-09-21_r2/index.html"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(); pg.goto(PAGE); pg.wait_for_timeout(1500)
    out = pg.evaluate("""() => ({
      cc: (typeof CC_CHARTS==='undefined'?[]:CC_CHARTS).map(d=>({
            id:d.id, code:d.code, group:d.group, title:d.title, unit:d.unit||'',
            idea:d.idea||'', reading:d.reading||'', spec:d.spec||null,
            better:d.better||'', inst:d.inst||'', type:d.type||'', source:d.source||''})),
      graphs: (typeof GRAPHS==='undefined'?[]:GRAPHS).map(g=>({
            id:g.id, group:g.group||'', title:g.title||'', note:g.note||'', scope:g.scope||''})),
      sopCC: (typeof SOP!=='undefined' && SOP.controlCharts) ? SOP.controlCharts : null,
      sopKeys: (typeof SOP!=='undefined') ? Object.keys(SOP) : []
    })""")
    b.close()
json.dump(out, open("defs.json","w"), indent=1)
print("cc", len(out["cc"]), "graphs", len(out["graphs"]))
print("cc keys sample:", out["cc"][0] if out["cc"] else None)
print("sop keys:", out["sopKeys"])
print("sopCC sample:", list((out["sopCC"] or {}).items())[:3])
