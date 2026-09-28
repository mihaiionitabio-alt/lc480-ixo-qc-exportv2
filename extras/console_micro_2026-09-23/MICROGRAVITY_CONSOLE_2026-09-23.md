# Console mode: one question at a time — 23 September 2026

> Historical design note. The released console is now button-only; see `BUTTON_CONSOLE_2026-09-23.md`.

A runnable build: `qpcr_console_micro.html`. It is the current production page with a console overlay added; nothing
else in the page changed, so every decoder, statistic and export is the same file's. Open it, load files as usual, then
press **C** or click **Console mode (C)** in the status bar.

`patch_micro_console.py` reproduces the build from the production page:

    python3 patch_micro_console.py qpcr_qc_forensics.html qpcr_console_micro.html

---

## 1. Why this shape

Working in microgravity changes what an interface may ask of a person. The body drifts, one hand is usually holding
the operator in place, gloves remove fine motor control, lighting is harsh and reflective, and the operator is often
doing something else with their eyes. So the console follows six rules:

1. **One question on screen.** The page computes what deserves attention and shows a single item. Everything else is
   one word away. No hunting through 56 tiles while floating.
2. **No precise pointing.** No hover, no drag, no double-click, no right-click, no small close control. Every target is
   at least 196 × 88 px, spaced 16 px apart; the smallest measured in the build is **218 × 120 px**.
3. **The same instruction in three modalities.** Every action has a number, a word and a button — *"next"*, `1`, or the
   big button. A command that works spoken works typed and pressed, with the same name.
4. **The number is the biggest thing on screen** (62 px), with its unit, its limits and its specification beside it,
   so a value can be judged from a distance and at an angle.
5. **Eyes-off operation.** Spoken replies are local (`speechSynthesis`), short, and say the state: *"B-H1. Peak heating
   rate. 4.757 °C/s. watch. Sustained shift since 2025-05-17."*
6. **Dark, high-contrast, glyph-coded.** ▲ outside limits, △ pattern inside limits, ● in control, ○ no limits yet —
   colour never carries the meaning alone, because a reflective visor and a glare-lit module both eat colour first.

## 2. What the console shows

The attention queue is built from the same findings the other views show, in this order:

| Priority | Item | Where it comes from |
|---|---|---|
| 1 | error-level findings, grouped by area (integrity, decode, contamination) | `reviewForensicEvents()` |
| 2 | control charts outside a limit, then charts with a pattern inside the limits | `ccCompute()` / `ccStatus()` over the selected instrument |
| 3 | runs rejected by the profile | `sopEvaluateAll()` |
| 4 | how many charts cannot judge anything yet (baseline incomplete), with the number of runs needed | the panel's own counters |
| 5 | "Nothing needs attention", with the run count, when the first four are empty | — |

Each item carries: severity glyph, code, name, **value with unit**, its limits and specification, the state sentence
the page already computes, the evidence line (instrument, number of runs, date of the last run), and — on request —
the chart itself, capped at 30 % of the screen so the value and the actions never leave the view.

With 12 real files plus the synthetic instrument history the queue built 14 items: 2 error groups, 6 charts outside
limits, 5 to watch, and the baseline summary.

## 3. The voice layer

**Design decision: the page does not depend on a speech service.** Recognition is an adapter; the page only consumes
text. Three sources, one command path:

```
  browser recogniser  ─┐
  external recogniser ─┼─►  mgCommand(text)  ─►  grammar match  ─►  action  ─►  spoken + written confirmation
  keyboard / typing   ─┘
```

* `window.qpcrVoice.submit("next")` — the stable entry point for any outside recogniser, foot switch, or test.
* `postMessage({type:"qpcr-voice", text:"open b h 1"})` — for a host application that wraps the page in a WebView and
  runs its own offline ASR.
* The browser's own recogniser, if it has one, is **off by default** and switched on with *"listen"*. In Chrome that
  recogniser is a network service; on a vehicle without that link, use one of the two sources above. The console says
  which state it is in ("voice off" / "listening" / "no recogniser in this browser").
* `window.qpcrVoice.state()` returns what is on screen — item number, code, severity, value — so an external assistant
  can read the console without scraping the DOM.

**Grammar** (each is a phrase, a number and a button):

| Say | Effect |
|---|---|
| next / previous / first / last · `1` `2` | move through the queue |
| chart · `3` | show or hide the chart of this item |
| read it / repeat | say the current item aloud |
| open B-H-1 | jump to any chart by code, even if it is not in the queue — the console builds the item |
| alarms only / everything | filter the queue to outside-limit items, or restore it |
| status | speak the phase, the counts and the number outside limits |
| control panel / results / review / load / sop | leave the console for that view |
| refresh | rebuild the queue from the current data |
| export charts · status report | produce a file — **asks for "confirm" or "cancel" first** |
| stop | stop a running file read |
| voice toggle · `8` | spoken replies on or off |
| help · `9` · `?` | the command list |
| exit console · `0` · Escape | back to the full page |

Safeguards: an optional wake word ("console …") is stripped before matching; results below 0.55 confidence are
rejected with *"heard … but not clearly — say it again"*; anything that produces a file or changes state asks for a
spoken **confirm**; an unrecognised phrase is repeated back rather than guessed at (*"not understood: 'make me a
sandwich' — say help"*). Everything the console heard and did is written on screen above the buttons, so a spoken
session leaves a visible trail.

## 4. Keyboard, for the same actions

`C` open · `1…0` the buttons in the order shown · `N`/`P` or arrows next/previous · `G` chart · `R` read ·
`S` status · `A` alarms only · `E` everything · `H` or `?` help · `Escape` back or out. The command line at the bottom
takes the same words as the voice grammar, so a tablet with a keyboard needs no microphone at all.

## 5. What was verified

* Build parses; the console opens with **C**, from the status-bar button, and by voice.
* Queue with 12 real runs + synthetic history: 14 items, correctly ordered (errors → outside limits → watch →
  baseline). Filter "alarms only" reduced it to 6.
* Voice bridge accepted *next, chart, read it, alarms only, status, open b h 1, everything, export charts, cancel,
  help, close help, exit console*; the chart opened by code for a chart that was not in the queue.
* Confirmation path: *export charts* → "say confirm or cancel" → *cancel* → "cancelled", no file produced.
* Nonsense rejected without action.
* Smallest action target 218 × 120 px; value type 62 px; no page errors in the session.

## 6. Limits, stated plainly

* The recogniser in a browser may be a network service. This build does not ship an offline recogniser; it ships the
  interface for one. Any local ASR that can post a string into the page drives the whole console.
* Spoken replies use the browser's voices; these are local in Chrome, Edge and Safari but the voice quality varies.
* The console reads the same data as the views; it cannot show anything the page has not computed.
* It is an overlay, not a replacement: the full page is one word away, and nothing in the analysis or the exports is
  touched.

## 7. If this direction is right, the next three steps

1. Decide the recogniser: host-side offline ASR posting into `qpcrVoice.submit()` is the only option that survives a
   link outage. A 30-word grammar of the kind in section 3 is within reach of a small on-device model.
2. Promote the console's reading of state into the normal views: the same queue drives a "what needs attention" strip
   on the Control panel, so the two never disagree.
3. Add a physical fallback: two switches (next / confirm) mapped to `1` and `confirm` cover most of the queue
   without speech or pointing.
