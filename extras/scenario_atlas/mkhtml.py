import sys, html
sys.path.insert(0, '/home/claude/gif')
from scen import CAPTIONS
from hist import HIST_CAPTIONS

RUN   = ['S1','S2','S3','S4','S5','S6','S7','S8']
YEAR  = ['S9','S10','S11','S12','S13','S14','S15','S16']
A = 'assets/scenarios'

css = """
.missy-scn{--ink:#102f4d;--teal:#0d8790;--amber:#e7a12c;--line:#dfe6ec;
  font:14px/1.55 system-ui,"Segoe UI",Arial,sans-serif;color:#26323c;max-width:1180px;margin:0 auto}
.missy-scn h3{font:600 19px/1.3 system-ui,Arial,sans-serif;color:var(--ink);margin:0 0 4px}
.missy-scn h4{font:600 15px/1.3 system-ui,Arial,sans-serif;color:var(--ink);
  margin:26px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.missy-scn .scn-sub{color:#64757f;margin:0 0 14px}
.missy-scn figure{margin:0 0 14px}
.missy-scn img{display:block;width:100%;height:auto;border:1px solid var(--line);
  border-radius:6px;background:#fff}
.missy-scn .scn-cap{font-size:12.5px;color:#64757f;margin-top:6px}
.missy-scn .scn-list{list-style:none;margin:0;padding:0;
  display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px}
.missy-scn .scn-list li{border:1px solid var(--line);border-left:3px solid var(--teal);
  border-radius:5px;padding:10px 12px;background:#fbfdfe}
.missy-scn .scn-list li.year{border-left-color:var(--amber)}
.missy-scn .scn-code{font:700 12px/1 ui-monospace,"Courier New",monospace;color:#fff;
  background:var(--ink);border-radius:3px;padding:3px 6px;margin-right:7px}
.missy-scn .scn-kind{font:12px/1 ui-monospace,"Courier New",monospace;color:#8a99a4;float:right}
.missy-scn .scn-name{font-weight:600;color:var(--ink)}
.missy-scn .scn-text{margin:7px 0 0}
.missy-scn .scn-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 0}
.missy-scn .scn-pair figcaption,.missy-scn .scn-solo figcaption{
  font:600 12px/1 ui-monospace,"Courier New",monospace;color:#64757f;margin:0 0 5px;
  text-transform:uppercase;letter-spacing:.06em}
.missy-scn details{margin-top:10px}
.missy-scn summary{cursor:pointer;color:var(--teal);font-weight:600}
.missy-scn .scn-note{border:1px dashed var(--amber);border-radius:5px;padding:8px 11px;
  margin:18px 0 0;font-size:12.5px;color:#6b5a30;background:#fffdf7}
@media (max-width:640px){.missy-scn .scn-pair{grid-template-columns:1fr}}
"""

def pair(code):
    return f"""        <div class="scn-pair">
          <figure><figcaption>normal</figcaption>
            <img loading="lazy" src="{A}/missy_scenario_{code}_normal.png" alt="{code} normal, generated data"></figure>
          <figure><figcaption>abnormal</figcaption>
            <img loading="lazy" src="{A}/missy_scenario_{code}_abnormal.png" alt="{code} abnormal, generated data"></figure>
        </div>"""

def card(code, name, text, animation):
    if animation:
        inner = f"""        <figure class="scn-solo"><figcaption>60 s loop &mdash; 15 s build, four times</figcaption>
          <img loading="lazy" src="{A}/missy_scenario_{code}_60s.gif"
               alt="{code}, sixty second loop, normal beside abnormal" width="1920" height="1080"></figure>
{pair(code)}"""
        label = 'Animation and single-run figures'
        kind = 'one run'
    else:
        inner = pair(code)
        label = 'Figures for a normal and an abnormal year'
        kind = 'one year'
    return f"""    <li{' class="year"' if not animation else ''}>
      <span class="scn-kind">{kind}</span>
      <span class="scn-code">{code}</span><span class="scn-name">{html.escape(name)}</span>
      <p class="scn-text">{html.escape(text)}</p>
      <details><summary>{label}</summary>
{inner}
      </details>
    </li>"""

run_items  = [card(c, *CAPTIONS[c], True)  for c in RUN]
year_items = [card(c, *HIST_CAPTIONS[c], False) for c in YEAR]

block = f"""<section class="missy-scn" id="scenario-atlas">
  <h3>Scenario atlas &mdash; what a failing run, and a failing year, look like</h3>
  <p class="scn-sub">Sixteen patterns. S1 to S8 are single runs, each with its own sixty-second
     loop: a fifteen-second build from cycle&nbsp;1 to cycle&nbsp;45, played four times, normal on
     the left and abnormal on the right. S9 to S16 are the views that only appear once a year of
     runs is opened together, and each has one normal and one abnormal figure. The explanations
     are text on this page, not drawing inside the images.</p>

  <figure>
    <img loading="lazy" src="{A}/missy_scenarios_60s_1920.gif"
         alt="Sixty second overview of the eight single-run scenarios"
         width="1920" height="1080">
    <p class="scn-cap">Overview &mdash; the eight single-run scenarios in four cycles of fifteen
       seconds. MISSY &middot; research use only &middot; not validated &middot; every value is
       generated for illustration.</p>
  </figure>

  <h4>Within one run &mdash; S1 to S8</h4>
  <ul class="scn-list">
{chr(10).join(run_items)}
  </ul>

  <h4>Across a year of runs &mdash; S9 to S16</h4>
  <p class="scn-sub">These need the history, not the run. Each one is invisible on the day and
     obvious once twelve months of experiments are plotted on the same axes.</p>
  <ul class="scn-list">
{chr(10).join(year_items)}
  </ul>

  <p class="scn-note">Everything shown here &mdash; the curves, the crossing cycles, the control
     behaviour, the calendar of runs and the people and instruments named in the groupings &mdash;
     is produced by a generator from stated parameters. It is made up. It illustrates the pattern
     each failure leaves behind and is not a result from any instrument or any laboratory.</p>
</section>"""

open('/home/claude/gif/out/missy_scenario_block.html','w').write(
    '<style>\n' + css.strip() + '\n</style>\n' + block + '\n')
open('/home/claude/gif/out/preview.html','w').write(
    f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>MISSY scenario atlas preview</title><style>body{{margin:28px;background:#f4f7f9}}
{css.strip()}</style></head><body>
{block.replace('src="assets/','src="../../assets/')}
</body></html>""")
print('written')
