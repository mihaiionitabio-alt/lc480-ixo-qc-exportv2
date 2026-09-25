# UI-only history — 2026-09-25

This record covers the GitHub website update made after the technical documentation build. The documentation files and PDF were intentionally left unchanged.

## Source

- File: `index.html`
- SHA-256: `61D3AAA5C1DEACD18ED9246E6F118CAE3FBE86DD93FCB1070DF369C6F74A8C65`
- Size: 926,089 bytes

## Changes

- Replaced the public page heading with: “Missy, RUO - A single-file local HTML page for .ixo, .eds/.edt and .rdml experiment runs”.
- Removed the MISSY logo from the page header.
- Moved the language selector and the website download button into the fixed bottom-left page bar.
- Kept the language selector ID and added one `dl-site` button that uses the existing archive generator for the selected language.
- Kept the operational status, Command mode, Console mode, Assisted mode, status report, and Details controls in the same bottom bar.
- Updated the document title to match the new public page identity.

## Verification

- Loaded the local file in Chromium with no page errors.
- Confirmed the new heading and document title.
- Confirmed the header logo is absent.
- Confirmed the language selector and website download button are descendants of `#statusbar` and render at the bottom-left.
- Added an inline empty favicon so static hosting does not emit a missing `/favicon.ico` warning.
- Documentation was not modified by this change.

## Follow-up UI change — 2026-09-25

- Replaced the separate English and Chinese ZIP buttons with one **Download website** button.
- The single button exports the website in the language currently selected in the language selector.
- Updated the localized button label and preserved the existing archive generator.
- Updated SHA-256: `067910E85FA92566AE871B5BC5D1FB4BEE9FE88DB13972CE16D3E1D7E6716C75`.

## Follow-up UI change — blue status bar — 2026-09-25

- Added the exact Missy page identity to the blue console/status bar below the heading.
- The text is visible alongside the current data state and remains ellipsis-safe on narrow layouts.
- Documentation was not modified.
- Updated SHA-256: `61D3AAA5C1DEACD18ED9246E6F118CAE3FBE86DD93FCB1070DF369C6F74A8C65`.

## Follow-up — Command mode documentation — 2026-09-25

- Added [`documentation/COMMAND_MODE.md`](documentation/COMMAND_MODE.md): line syntax, every command, patterns, the accepted shape of every option value, which figures actually use `target` / `control`, all 58 control charts with their own type and the `type` values that suit them, a complete commented hand-over script, and the error messages.
- The Script-box template now has a `#   full example:` line under every `# … options:` line, with every option filled in, and two header notes on `target` and `control`.
- `target=all` (any case) now means every target. Before, it was compared as a target literally named “all”, so the shipped template drew empty curves, plate, standard-curve, end-point and control figures. `img:curves` with `target=all` now draws every target instead of only the first.
- Verified in Chromium: page loads without errors; the whole template and all 84 full-example lines parse without errors.
- The LaTeX documentation and PDF were not modified.
- Updated SHA-256: `CFBAC45B429D66022339E082AEFD4BB4CCD1C0D6A195F12E6F89E008D9D4C4DF`; size 939,974 bytes.

## Follow-up — control-chart types in the default script — 2026-09-25

- Every `select cc:… ` line in the Script-box template now uses the chart's own type (`trend`, `ewma`, `cusum`, `xbars`, `p`, `u`, `c`, `funnel` or `i`) instead of `type=i` for all 58 charts. With `type=i`, the 16 `p`/`u`/`c`/`funnel` charts drew empty and appeared in the archive under `errors/`.
- Verified in Chromium: page loads without errors; the whole template parses without errors.
- Updated SHA-256: `086D07E3FDAB35476F544C56E0F2ED9C74B008F14160E2015D7D62FE90951BE8`; size 940025 bytes.
