# UI-only history — 2026-09-25

This record covers the GitHub website update made after the technical documentation build. The documentation files and PDF were intentionally left unchanged.

## Source

- File: `index.html`
- SHA-256: `7383F75F20EDE582EE986E783A5D51D63BE0B7041EAAD76BE35DCAB35AB91142`
- Size: 926,088 bytes

## Changes

- Replaced the public page heading with: “Missy, RUO - A single-file local HTML page for .ixo, .eds/.edt and .rdml experiment runs”.
- Removed the MISSY logo from the page header.
- Moved the language selector and the English/Chinese website ZIP download buttons into the fixed bottom-left page bar.
- Kept the existing element IDs (`language-select`, `dl-site-en`, and `dl-site-zh`) so language switching and both downloads continue to use the existing implementation.
- Kept the operational status, Command mode, Console mode, Assisted mode, status report, and Details controls in the same bottom bar.
- Updated the document title to match the new public page identity.

## Verification

- Loaded the local file in Chromium with no page errors.
- Confirmed the new heading and document title.
- Confirmed the header logo is absent.
- Confirmed all three language/download controls are descendants of `#statusbar` and render at the bottom-left.
- Documentation was not modified by this change.
