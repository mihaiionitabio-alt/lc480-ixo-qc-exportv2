# Button-only console — 23 September 2026

The console no longer exposes speech recognition, speech synthesis, a command text field, voice status, or external voice-message adapters. All console interaction is through visible buttons.

Selecting a chart changes the console into a chart-only view. The chart occupies the work area and the bottom action bar provides:

- Previous chart
- Next chart
- Close chart
- Return to the page

When a run set has no alarm chart, the console appends a chart gallery with every usable chart and its available variants. This makes Next and Previous useful after loading a small file set. The chart action bar also provides chart-type buttons, X-axis buttons, Light theme, and Dark theme buttons. High-contrast theme was removed.

The console top bar contains horizontal navigation buttons for Load files, SOP, Results, Control panel, Graphs, Quality & forensic review, and Open formats.

The ordinary item view keeps Next, Previous, item-specific actions, and Return to the page. The existing control-chart calculations and exports are unchanged.

The release entry points are `qpcr_qc_forensics.html` and `index.html`. The standalone candidate remains `qpcr_qc_forensics_console.html`. The overlay generator is `patch_micro_console.py`.
