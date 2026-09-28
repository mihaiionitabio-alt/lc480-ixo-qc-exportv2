# Command mode — full reference with fully loaded examples

Command mode is a typed window for a procedure that has been written down. Every line you
can type can also be pasted into the **Script** box, so a hand-over becomes repeatable.
Open it from the bottom bar (**Command mode**). Every command answers in the window;
nothing happens silently, and no command changes a stored value.

This page describes what the page actually accepts (`index.html`, section “7 . Command
mode” and `SEL_OPTION_RULES`). Where an option is accepted but has no effect yet, it says so.

---

## 1. Anatomy of a line

```
select   img:curves   target=HPV16   signal=drn   log=yes
└─verb─┘ └─pattern──┘ └──────────── options key=value ─────┘
```

| Part | Rule |
|---|---|
| **verb** | The first word. Case-insensitive (`SELECT` = `select`). |
| **pattern** | One or more item identifiers or wildcards (see §3). Several patterns may be separated by spaces or commas. |
| **options** | Any word that contains `=` after its first character is an option. Everything else is a pattern. |
| **key** | Case-sensitive, exactly as documented: `specLo`, `specHi`, `warnAhead`, `L` (capital), `k`, `h`. |
| **value** | Everything after the first `=`. Case-sensitive for fixed choices (`signal=Stored` is refused). Can be empty: `specLo=`. |
| **spaces** | Words are split on spaces. **A value cannot contain a space** — there is no quoting. A target called `SARS CoV-2 N` cannot be named; rename the target in the instrument software, or leave `target` empty. |
| **notes** | A line whose first non-blank character is `#` is a note and is skipped. A `#` later in a line is *not* a comment: `run 1 # second file` is refused and `lab X # note` stores the note in the laboratory name. |
| **duplicates** | The same key twice on one line is refused: `error: duplicate option target`. |
| **scope** | Options apply to every item the pattern matches, and every one of them is validated first. `select img:* signal=drn` fails, because `img:timeline` does not accept `signal`. |
| **memory** | Options merge: a later `select`/`set` on the same item changes only the keys it names. `reset <pattern>` returns the item to defaults. `clear` empties both the selection and all options. |

Options are held for the session only. They are not written into `selection.csv` or the profile.

---

## 2. Commands

| Command | Arguments | Effect |
|---|---|---|
| `help` or `?` | — | Lists the commands. |
| `list` | `images` \| `data` \| `tables` \| `all` (default) | Every selectable item with its identifier; `(not available yet)` when the loaded files cannot feed it. |
| `select` / `add` | `<pattern…> [key=value…]` | Adds the matched items to the selection and applies the options. |
| `only` | `<pattern…> [key=value…]` | Empties the selection first, then does the same as `select`. |
| `set` | `<pattern…> key=value…` | Changes options on items that are **already selected**; otherwise `error: set requires selected items`. |
| `show` | `<pattern…>` | Prints the options in force, e.g. `img:curves: {"target":"HPV16","signal":"drn","log":"yes"}`. `{}` means defaults. |
| `reset` | `<pattern…>` | Forgets the options of the matched items (they stay selected). |
| `deselect` / `remove` | `<pattern…>` | Takes items out of the selection. |
| `clear` | — | Empty selection, all options forgotten. |
| `selection` | — | What is selected now. |
| `runs` | — | The loaded runs with their numbers (0, 1, 2 …). |
| `run` | `<number>` \| `all` | Which loaded run the *run-level* figures draw (§4.1). `run all` = run 0. |
| `lab` | `<free text, spaces allowed>` | Laboratory name. Printed on the report, stored in the profile (it changes the profile checksum). Empty clears it. |
| `analyst` | `<free text, spaces allowed>` | Who did the analysis. Same behaviour as `lab`. |
| `title` | `<free text, spaces allowed>` | Report title. Empty returns to the default (`Selected results — <run>`). |
| `profile` | — | Profile name, version, laboratory, analyst and `sha256` checksum. |
| `status` | — | Files read, results, selected items, profile. |
| `pdf` | `[name]` | Builds the report of the selection and downloads `<name>.pdf`. |
| `zip` | `[name]` | Builds the archive and downloads `<name>.zip` (§6). |
| `template` | — | Downloads `selection_template.csv` (every item with `include=yes/no`). |
| `script` | — | Opens the Script box. |
| `close` / `quit` / `exit` | — | Leaves command mode. |

A multi-line paste into the one-line command field is moved to the Script box instead of
being run; press **Run** there.

---

## 3. Patterns

| Pattern | Matches |
|---|---|
| `img:curves` | exactly that item |
| `curves` | the same — the `img:` / `data:` / `cc:` / `rec:` prefix may be omitted |
| `img:*` | every figure |
| `img:x_*` | every *Across runs* figure |
| `cc:?_cq` | `?` stands for exactly one character |
| `images` | every figure (`img:*`) |
| `data` or `tables` | every table (`data:*` and `rec:*`) |
| `cc:all` | every control chart |
| `cc:hardware`, `cc:software`, `cc:method`, `cc:operator` | the control charts of that group |
| `all` or `*` | everything |
| `img:plate data:cq_values` or `img:plate,data:cq_values` | both |

Matching is case-insensitive. A pattern that matches nothing is an error (`nothing matches …`).

---

## 4. Option value shapes

| Shape (as shown in the template) | Accepted | Refused |
|---|---|---|
| `<text>` | any word without spaces, or empty | — (never refused, so a misspelt target silently draws nothing) |
| `a\|b\|c` | exactly one of the listed words, same case | anything else → `must be one of …` |
| `<number>` | anything JavaScript reads as a finite number: `20`, `0.2`, `2.7`, `-1`, `1e-3` | `abc`, empty |
| `<number\|empty>` | a number, or nothing after `=` | `abc` |
| `<integer>` | digits only: `0`, `10`, `200` | `-1`, `2.5`, empty |
| `all\|<number\|name>` (run) | `all`, digits (`0`, `1`, …), or the exact name of a loaded run as `runs` prints it | anything else |
| `<chart/group list>` | `*`, or letters, digits, `_`, `-` and commas: `heat_rate,cool_rate` | spaces, other characters |

### 4.1 `target` and `control` on figures

* **`target=<name>`** keeps only results of that target (compared exactly, case-sensitive,
  with the target — or analysis — name the file stores). Use `list`/the Results tab to read
  the exact names.
* **`target=all`** (any case) or **`target=`** (empty) = every target.
  Exception: `img:curves` with an *empty* target draws the first target of the run;
  write `target=all` to draw all of them.
* **`control=<number>`** is the **position of the control in the profile, SOP section 3,
  counted from 0** (`control=0` is the first control, `control=1` the second…). It is not a
  name. Default `0`.
  A non-number on `img:x_control` gives *“Define a control in the SOP (section 3)”*;
  on `img:x_control_batches|age|thermal` it means “every control”.
* Every figure *accepts* `target` and `control` (so a script can set them uniformly), but
  only the figures listed below *use* them. Elsewhere they are stored and ignored.

### 4.2 Which run a figure draws

Figures in the groups *Run history*, *Plate*, *Fluorescence* and *Results* draw **one run**:
the one chosen with `run <number>` (default 0 = first loaded file). *Across runs* figures
(`img:x_*`) always use every loaded run. Control charts use the first instrument found in
the loaded history.

---

## 5. Every item, with a fully loaded example

The examples use a target called `HPV16`; replace it with a name from your own files.

### 5.1 Figures (`img:`)

| Item | Options (shape) | Used by the figure | Fully loaded example |
|---|---|---|---|
| `img:timeline` | `target=<text>; control=<text>` | none | `select img:timeline target=HPV16 control=0` |
| `img:curves` | `target=<text>; signal=stored\|drn; log=yes\|no` | all three | `select img:curves target=HPV16 signal=drn log=yes` |
| `img:plate` | `metric=outcome\|status\|cq\|end_fluorescence\|background\|amplitude; target=<text>` | both | `select img:plate metric=cq target=HPV16` |
| `img:unanalysed` | `target=<text>; control=<text>` | none | `select img:unanalysed target=HPV16 control=0` |
| `img:cqstrip` | `colourby=outcome\|role; target=<text>` | `colourby` | `select img:cqstrip colourby=role target=HPV16` |
| `img:repsd` | `target=<text>; control=<text>` | none | `select img:repsd target=HPV16 control=0` |
| `img:stdcurve` | `target=<text>; control=<text>` | `target` | `select img:stdcurve target=HPV16 control=0` |
| `img:ic` | `target=<text>; control=<text>` | none | `select img:ic target=HPV16 control=0` |
| `img:endpoint` | `level=end\|amplitude; target=<text>` | both | `select img:endpoint level=amplitude target=HPV16` |
| `img:levels` | `target=<text>; control=<text>` | none | `select img:levels target=HPV16 control=0` |
| `img:outcomes` | `target=<text>; control=<text>` | none | `select img:outcomes target=HPV16 control=0` |
| `img:temperature` | `target=<text>; control=<text>` | none | `select img:temperature target=HPV16 control=0` |
| `img:recalc` | `target=<text>; control=<text>` | none | `select img:recalc target=HPV16 control=0` |
| `img:lc_thermal` | `target=<text>; control=<text>` | none | `select img:lc_thermal target=HPV16 control=0` |
| `img:x_timeline` | `target=<text>; control=<text>` | none | `select img:x_timeline target=HPV16 control=0` |
| `img:x_delay` | `target=<text>; control=<text>` | none | `select img:x_delay target=HPV16 control=0` |
| `img:x_accept` | `target=<text>; control=<text>` | none | `select img:x_accept target=HPV16 control=0` |
| `img:x_outcomes` | `target=<text>; control=<text>` | none | `select img:x_outcomes target=HPV16 control=0` |
| `img:x_control` | `target=<text>; control=<text>` | both | `select img:x_control target=HPV16 control=1` |
| `img:x_signal` | `target=<text>; control=<text>` | none | `select img:x_signal target=HPV16 control=0` |
| `img:x_duration` | `target=<text>; control=<text>` | none | `select img:x_duration target=HPV16 control=0` |
| `img:x_findings` | `target=<text>; control=<text>` | none | `select img:x_findings target=HPV16 control=0` |
| `img:x_control_batches` | `target=<text>; control=<text>` | both | `select img:x_control_batches target=HPV16 control=1` |
| `img:x_control_age` | `target=<text>; control=<text>` | both | `select img:x_control_age target=HPV16 control=1` |
| `img:x_control_thermal` | `target=<text>; control=<text>` | both | `select img:x_control_thermal target=HPV16 control=1` |

What the fixed choices mean:

| Option | Value | Meaning |
|---|---|---|
| `signal` | `stored` (default) | fluorescence as stored in the file |
| | `drn` | QuantStudio ΔRn as stored; wells without ΔRn are left out; the stored threshold is drawn |
| `log` | `yes` / `no` (default) | logarithmic fluorescence axis |
| `metric` | `outcome` (default) | well colour = SOP outcome |
| | `status` | well colour = analysis status, including signal outside any analysis |
| | `cq`, `end_fluorescence`, `background`, `amplitude` | heat map of that number |
| `colourby` | `outcome` (default) / `role` | colour Cq points by SOP outcome or by sample role |
| `level` | `end` (default) / `amplitude` | end-point fluorescence, or plateau minus background |

### 5.2 Tables (`data:` and `rec:`)

Shape for every table: `run=all|<number|name>; rows=<integer>; pseudo=yes|no`.

```
select data:cq_values run=all rows=200 pseudo=yes     # every run
select data:cq_values run=1 rows=50 pseudo=no          # second loaded run
select data:cq_values run=2026-09-12_HPV_plate3 rows=0 pseudo=no   # a run named exactly as `runs` prints it
```

> **Current behaviour.** These three options are validated and remembered (`show` prints
> them), but the table builders do not read them yet: a table always contains **every
> row of every loaded run**, and pseudonymisation follows the **Pseudonymise sample names in
> downloads** switch. Setting them is harmless and keeps a script ready for when they are wired.

| Item | Contents |
|---|---|
| `data:cq_values` | Stored Cq values — one row per stored result with well, sample, target, role and call |
| `data:melting_peaks` | Melting peaks — temperature, area, width and height per stored peak |
| `data:experiment_settings` | Every setting read out of the container, with the property it came from |
| `data:plate_map` | Position, sample, target and role as the file describes the plate |
| `data:statistics` | Per target and group: counts, mean Cq, spread and detection |
| `data:runs_and_qc` | One row per run with its profile answer and the reason behind it |
| `data:forensic_log` | Every forensic finding with area, severity and evidence |
| `data:control_charts` | Plotted points of the control series with their limits |
| `data:amplification_curves` | Fluorescence of every well, one row per cycle |
| `data:sop_answers` | What the profile concluded for every sample |
| `data:relative_quantification` | Relative quantification rows from the stored analysis |
| `data:multicomponent_raw` | Raw multicomponent signal rows from exchange containers |
| `data:experiment_meta` | Metadata fields of every loaded experiment |
| `data:sample_comparison` | Paired sample comparison for the first two loaded runs |
| `data:rising_curves` | Curve events kept for review where the channel has no stored result |
| `data:sop_criteria` | One row per evaluated profile criterion |
| `data:sop_runs` | One row per run with profile status and counts |
| `rec:instrument_records` | Metadata, protocol, channels, subsets, analyses and statistics |

### 5.3 Control charts (`cc:`)

Shape for every chart:

```
type=i|ewma|cusum|trend|xbars|p|u|c|funnel; x=order|date|hours|cycles; phase1=<number>;
lambda=<number>; L=<number>; k=<number>; h=<number>; specLo=<number|empty>;
specHi=<number|empty>; warnAhead=<integer>; charts=<chart/group list>
```

Fully loaded example (every key set, all values valid):

```
select cc:heat_rate type=trend x=date phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo=1.5 specHi= warnAhead=10 charts=heat_rate
```

| Key | Shape | Default | Meaning |
|---|---|---|---|
| `type` | one word | the chart's own type (table below) | `i` individuals (Shewhart, 3σ + Western Electric rules), `ewma` exponentially weighted moving average, `cusum` two one-sided cumulative sums, `trend` regression line with forecast to the limit, `xbars` X̄/S of subgroups, `p` proportion, `u` rate per exposure, `c` count, `funnel` operator comparison |
| `x` | one word | the chart's own axis, otherwise `order` | `order` run order (by date), `date` calendar date, `hours` cumulative run hours in the loaded archive, `cycles` instrument block-cycle counter (falls back to `hours` when the file has none). Not used by `funnel`. |
| `phase1` | number | `20` | runs in the baseline (Phase I) that set the centre line and limits; at least 5 are always used |
| `lambda` | number | `0.2` | EWMA weight, 0.05–1 (only `ewma`) |
| `L` | number | `2.7` | EWMA limit width in σ (only `ewma`) — capital **L** |
| `k` | number | `0.5` | CUSUM allowance in σ (only `cusum`) |
| `h` | number | `4` | CUSUM decision interval in σ (only `cusum`) |
| `specLo` | number or empty | empty → built-in spec for the platform, if any | lower specification limit, in the chart's unit |
| `specHi` | number or empty | as above | upper specification limit, in the chart's unit |
| `warnAhead` | integer | `10` | `trend`: warn when the forecast reaches a limit within this many runs |
| `charts` | `*` or list | — | accepted and remembered; not used by the computation yet |

Options given here override the profile’s saved control-chart settings **only while the
figure is drawn** for the report/archive; the profile itself is left unchanged.

**Pick a `type` from the same family as the chart’s own type.** A continuous chart can
be drawn as `i`, `ewma`, `cusum` or `trend`; an `xbars` chart also as those four; `p`, `u`,
`c` and `funnel` charts only as themselves. A wrong family does not stop the script: the
figure fails or comes out empty, and in the ZIP it appears as `errors/<item>.txt`.

| Item | Code | Group | Title | Unit | Own type | Valid `type` values |
|---|---|---|---|---|---|---|
| `cc:heat_rate` | B-H1 | hardware | Peak heating rate (2-s window) | °C/s | `trend` | i, ewma, cusum, trend |
| `cc:cool_rate` | B-H2 | hardware | Peak cooling rate (2-s window) | °C/s | `trend` | i, ewma, cusum, trend |
| `cc:overshoot` | B-H3 | hardware | Overshoot at the denaturation step | °C | `cusum` | i, ewma, cusum, trend |
| `cc:settling` | B-H3b | hardware | Settling time at the denaturation step | s | `i` | i, ewma, cusum, trend |
| `cc:transition` | B-H3c | hardware | Transition time A → B °C | s | `i` | i, ewma, cusum, trend |
| `cc:hold_temp` | B-H4 | hardware | Temperature at the moment of reading | °C from setpoint | `xbars` | xbars, i, ewma, cusum, trend |
| `cc:zone_spread` | B-H5 | hardware | Block zone uniformity (95th percentile) | °C | `ewma` | i, ewma, cusum, trend |
| `cc:heatsink_max` | B-H6 | hardware | Heat-sink maximum | °C | `i` | i, ewma, cusum, trend |
| `cc:cover_temp` | B-H6b | hardware | Heated cover temperature | °C | `i` | i, ewma, cusum, trend |
| `cc:lamp_ref` | B-H8 | hardware | Lamp reference channel (stability) | reference counts | `i` | i, ewma, cusum, trend |
| `cc:lamp_drift` | B-H9 | hardware | Lamp drift within a run | % change in the run | `i` | i, ewma, cusum, trend |
| `cc:led_current` | B-H10 | hardware | LED drive current | current (as logged) | `trend` | i, ewma, cusum, trend |
| `cc:led_junction` | B-H10b | hardware | LED junction temperature (maximum) | °C | `i` | i, ewma, cusum, trend |
| `cc:exposure` | B-H11 | hardware | Automatic integration time / exposure | ms | `i` | i, ewma, cusum, trend |
| `cc:saturation` | B-H12 | hardware | Saturated well images | share of well images | `p` | p |
| `cc:calib_uniformity` | B-H13 | hardware | Uniformity calibration: edge-to-centre ratio | edge / centre | `i` | i, ewma, cusum, trend |
| `cc:calib_background` | B-H13b | hardware | Background calibration: mean offset | counts | `i` | i, ewma, cusum, trend |
| `cc:calib_roi` | B-H13c | hardware | Well-position (ROI) calibration: spot diameter | pixels | `i` | i, ewma, cusum, trend |
| `cc:wheel_ms` | B-H14 | hardware | Filter-wheel move time | ms | `i` | i, ewma, cusum, trend |
| `cc:wheel_slow` | B-H14b | hardware | Filter-wheel moves slower than 500 ms | share of moves | `p` | p |
| `cc:encoder` | B-H15 | hardware | Filter-wheel position offset | encoder counts | `i` | i, ewma, cusum, trend |
| `cc:cam_overhead` | B-H16 | hardware | Camera readout time beyond the exposure | ms | `xbars` | xbars, i, ewma, cusum, trend |
| `cc:chan_switch` | B-H17 | hardware | Channel switch time | ms | `i` | i, ewma, cusum, trend |
| `cc:cover_down` | B-H18 | hardware | Heated cover lowering time | s | `trend` | i, ewma, cusum, trend |
| `cc:cover_up` | B-H18b | hardware | Heated cover raising time | s | `i` | i, ewma, cusum, trend |
| `cc:bg_median` | A-H3 | hardware | Background fluorescence per channel | fluorescence | `i` | i, ewma, cusum, trend |
| `cc:plateau_median` | A-H3b | hardware | End-point fluorescence per channel | fluorescence | `i` | i, ewma, cusum, trend |
| `cc:run_minutes` | A-H4 | hardware | Run duration | minutes | `i` | i, ewma, cusum, trend |
| `cc:cmd_rt` | B-S1 | software | Reply time to the PC software | ms (95th pct) | `i` | i, ewma, cusum, trend |
| `cc:tick_late` | B-S2 | software | Once-per-second timer lateness | ms (95th pct) | `i` | i, ewma, cusum, trend |
| `cc:catch_up` | B-S2b | software | Scheduler falling behind | events per run hour | `u` | u |
| `cc:img_proc` | B-S3 | software | Image → processing delay | ms (95th pct) | `i` | i, ewma, cusum, trend |
| `cc:roi_ms` | B-S4 | software | Image analysis time | ms | `i` | i, ewma, cusum, trend |
| `cc:runtime_err` | B-S5 | software | Run-time prediction error | % | `i` | i, ewma, cusum, trend |
| `cc:handoff_min` | B-S6 | software | Data hand-off time | minutes | `i` | i, ewma, cusum, trend |
| `cc:log_errors` | B-S8 | software | Command errors in the instrument log | errors | `c` | c |
| `cc:cycle_sd` | B-S9 | software | Cycle-timing regularity | ms | `i` | i, ewma, cusum, trend |
| `cc:templog_late` | B-S10 | software | Temperature-log intervals over 500 ms | share of intervals | `p` | p |
| `cc:invalid_acq` | B-S11 | software | Invalid fluorescence readings | share of readings | `p` | p |
| `cc:ct_mismatch` | B-S12 | software | Stored Ct not reproducible (> 0.2) | share of wells | `p` | p |
| `cc:edit_delay` | A-S4 | software | Run end → last change | log10 hours | `i` | i, ewma, cusum, trend |
| `cc:findings` | A-S6 | software | Forensic findings per run | findings | `c` | c |
| `cc:pc_cq` | A-M1 | method | Positive control Cq (Levey-Jennings) | Cq | `i` | i, ewma, cusum, trend |
| `cc:pc_amplitude` | B-M1 | method | Probe signal strength (positive control) | fluorescence | `ewma` | i, ewma, cusum, trend |
| `cc:rox_level` | B-M2 | method | Passive reference (ROX) level | passive reference | `i` | i, ewma, cusum, trend |
| `cc:efficiency` | B-M3 | method | PCR efficiency from the standards | % efficiency | `trend` | i, ewma, cusum, trend |
| `cc:ntc_rate` | B-M5 | method | Negative controls by process stage | share of NTC wells | `p` | p |
| `cc:ic_shift` | B-M6 | method | IC shift from fixed reference | cycles | `ewma` | i, ewma, cusum, trend |
| `cc:low_conf` | B-M9 | method | Low Cq confidence | share of wells | `p` | p |
| `cc:late_rate` | B-M10 | method | Late signal / stochastic-zone results | share of results | `p` | p |
| `cc:rep_sd` | B-O1 | operator | Replicate precision (pooled SD, Cq < 30) | Cq SD | `i` | i, ewma, cusum, trend |
| `cc:rox_cv` | B-O2 | operator | Dispensed-volume spread (ROX CV) | % CV | `i` | i, ewma, cusum, trend |
| `cc:rowcol` | B-O3 | operator | Row / column pattern | Cq | `i` | i, ewma, cusum, trend |
| `cc:ntc_op` | B-O5 | operator | Contamination rate by operator (funnel) | share of NTC wells | `funnel` | funnel |
| `cc:action_op` | B-O6 | operator | Repeat / inconclusive / invalid rate by operator (funnel) | share of results | `funnel` | funnel |
| `cc:manual_rate` | B-O7 | operator | Manual interventions | share of settings | `p` | p |
| `cc:call_disagree` | B-O9 | operator | Stored calls that disagree with the SOP | share of wells | `p` | p |
| `cc:copied` | B-O11 | operator | Copied-data events | events | `c` | c |

Examples of each family, fully loaded:

```
select cc:pc_cq      type=i      x=date   phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo=28 specHi=34 warnAhead=10 charts=pc_cq
select cc:ic_shift   type=ewma   x=order  phase1=15 lambda=0.3 L=3   k=0.5 h=4 specLo=-1 specHi=1  warnAhead=10 charts=ic_shift
select cc:overshoot  type=cusum  x=hours  phase1=25 lambda=0.2 L=2.7 k=0.5 h=5 specLo=   specHi=1.5 warnAhead=10 charts=overshoot
select cc:efficiency type=trend  x=date   phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo=90 specHi=110 warnAhead=5 charts=efficiency
select cc:hold_temp  type=xbars  x=cycles phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo=-0.5 specHi=0.5 warnAhead=10 charts=hold_temp
select cc:late_rate  type=p      x=order  phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo= specHi=0.05 warnAhead=10 charts=late_rate
select cc:catch_up   type=u      x=hours  phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo= specHi= warnAhead=10 charts=catch_up
select cc:findings   type=c      x=date   phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo= specHi= warnAhead=10 charts=findings
select cc:ntc_op     type=funnel x=order  phase1=20 lambda=0.2 L=2.7 k=0.5 h=4 specLo= specHi= warnAhead=10 charts=ntc_op
```

Keys that a type does not use (for example `lambda` on a `cusum` chart) are accepted and
ignored, so a script may carry the same full option set on every chart.

Several charts at once — the options are applied to every match:

```
# all 28 hardware charts; every cc chart accepts every key, so this is accepted
select cc:hardware type=i x=date phase1=30
# change one key on a selected chart, keep the rest
set cc:heat_rate x=order
# prints  cc:heat_rate: {"type":"i","x":"order","phase1":"30"}
show cc:heat_rate
# back to the profile settings
reset cc:hardware
```

> Note: the key check only validates *shape*; it does not check that `type=i` suits a `p`
> chart. `select cc:hardware type=i` is accepted, but the `p` charts in that group
> (`saturation`, `wheel_slow`) will then draw empty. Prefer per-chart lines as in the
> template.

---

## 6. What `pdf` and `zip` produce

`pdf [name]` → `<name>.pdf` (default `<laboratory>_report.pdf`): a cover (laboratory,
analyst, profile and checksum, build time, runs loaded, contents), then one page per
selected item — the figure plus the first 28 rows of the numbers behind it, or the first
28 rows of the table.

`zip [name]` → `<name>.zip` (default `<laboratory>_selection.zip`):

```
figures/<item>.svg        every selected figure
figures/<item>.csv        the numbers behind it, when it has any
tables/<table>.csv        every selected table, all rows
errors/<item>.txt         an item that could not be built, with the reason
selection.csv             the catalogue with include=yes/no (re-importable)
sop_profile.json          the profile in force (includes lab and analyst)
README.txt                laboratory, analyst, profile checksum, build time, runs, items
```

Both refuse to run with an empty selection. Sample names are pseudonymised when the
**Pseudonymise sample names in downloads** switch is on.

---

## 7. A complete, commented hand-over script

Comments must be on their own line: a `#` after a command is read as part of the command.

```
# ---- who and what ----------------------------------------------------------
# lab, analyst and title take free text; spaces are allowed
lab Laboratory of molecular biology
analyst A. Analyst
title HPV panel - September 2026 hand-over
# print the run numbers into the log, then draw run-level figures from the 2nd file
runs
run 1

# ---- figures -----------------------------------------------------------------
# start a fresh selection
only img:timeline
select img:curves target=HPV16 signal=stored log=yes
# the same item again: options merge, the last value wins
select img:curves target=all signal=drn log=no
select img:plate metric=cq target=HPV16
select img:cqstrip colourby=role
select img:endpoint level=amplitude target=all
select img:stdcurve target=HPV16
# first control in SOP section 3, one target
select img:x_control control=0 target=HPV16
# second control, every target
select img:x_control_age control=1 target=
# the other across-run figures, with defaults
select img:x_*

# ---- tables ------------------------------------------------------------------
select data:cq_values data:sop_answers data:forensic_log run=all rows=200 pseudo=yes
select rec:instrument_records

# ---- control charts ----------------------------------------------------------
select cc:pc_cq type=i x=date phase1=20 specLo=28 specHi=34
select cc:efficiency type=trend x=date phase1=20 specLo=90 specHi=110 warnAhead=5
select cc:late_rate type=p x=order phase1=20
select cc:ntc_op type=funnel

# ---- check, then build -------------------------------------------------------
selection
show img:curves
profile
pdf handover_2026_09
zip handover_2026_09
```

The **Script** box ships with a longer version of this that lists *every* item, with the
option shapes on a `# … options:` line and a `#   full example:` line (every option filled
in) above each command.

---

## 8. Messages and what they mean

| Message | Cause | Fix |
|---|---|---|
| `unknown command: xyz` | first word is not a command | `help` |
| `an item pattern is required` | `select` with only options | add `img:…`, `data:…` or `cc:…` |
| `nothing matches img:curve` | misspelt identifier | `list` |
| `img:timeline does not accept option signal` | option not in that item’s shape | see §5; with wildcards, every match must accept it |
| `signal must be one of stored, drn` | value not in the list, or wrong case | use the listed word exactly |
| `phase1 must be numeric` | `<number>` given text or nothing | `phase1=20` |
| `specHi must be numeric or empty` | text after `specHi=` | `specHi=2.5` or `specHi=` |
| `warnAhead must be a non-negative integer` | `-1`, `2.5`, empty | `warnAhead=10` |
| `run must identify a loaded run or all` | name not loaded | `runs`, then use `all`, a number or the exact name |
| `charts must be * or a chart/group list` | space or other character | `charts=heat_rate,cool_rate` |
| `duplicate option target` | same key twice on one line | keep one |
| `set requires selected items` | `set` on an item not yet selected | `select` it first |
| `run must be 0..N` | `run <number>` out of range | `runs` |
| `nothing is selected — try: …` | `pdf`/`zip` with an empty selection | `select …` |
| figure says *Define a control in the SOP (section 3)* | `control=` points past the list or is not a number | `control=0`, `1`, … |
| figure is empty with a target set | `target=` does not match exactly (case, spaces) | copy the name from the Results tab, or `target=all` |
