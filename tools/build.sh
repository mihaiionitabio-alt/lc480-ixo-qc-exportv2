#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# NOT RUNNABLE IN THIS REPOSITORY, and kept only as the record of how the
# diagrams and the gallery were generated.  Three things are missing here:
#   * it uses docs/latex/ — the layout of a separate repository that was never
#     built; this one uses documentation/latex/
#   * it calls extract2.mjs and gen_diagrams.py, which are not committed
#   * it reads chV2_functions.tex.before_singlecolumn_20260924, which is not
#     committed either: the generated chapter supersedes it (705 entries and
#     705 diagrams against that file's 676 and none)
# To rebuild the document as committed you do not need this script.  Supply
# documentation/latex/fonts/msyh.ttc and run xelatex over main.tex three times.
# ---------------------------------------------------------------------------
# Rebuild the 28 September 2026 documentation from a clone of this repository.
#
#   bash tools/build.sh /path/to/index_interactive_2026-09-27.html
#
# Needs: XeLaTeX (TeX Live 2022+), Python 3.11 with reportlab pypdf playwright,
# Node 20 with acorn acorn-walk, a Chromium for Playwright, and a CJK-capable
# monospace font at docs/latex/fonts/msyh.ttc (see docs/fonts/README.md).
set -euo pipefail

PAGE="${1:-page/index_interactive_2026-09-27.html}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LATEX="$ROOT/docs/latex"
cd "$ROOT"

[ -f "$LATEX/fonts/msyh.ttc" ] || { echo "missing $LATEX/fonts/msyh.ttc — see docs/fonts/README.md"; exit 1; }
[ -f "$LATEX/chV2_functions.tex.before_singlecolumn_20260924" ] || {
  echo "missing the Chapter 19 input (chV2_functions.tex.before_singlecolumn_20260924)"; exit 1; }

echo "== 1. parse the page =="
node tools/extract2.mjs "$PAGE"                      # -> functions.json

echo "== 2. the 705 software diagrams =="
python3 tools/gen_diagrams.py                        # -> docs/latex/fig/fndiag/

echo "== 3. the 66 captures (needs demo-data/ and a browser) =="
if [ -d demo-data ]; then
  python3 tools/shoot.py  && python3 tools/shoot2.py
  python3 tools/shoot3.py && python3 tools/shoot4.py
else
  echo "   demo-data/ not present — download the Release asset to include Chapter 20"
fi

echo "== 4. Chapter 19, from its recorded input =="
cp "$LATEX/chV2_functions.tex.before_singlecolumn_20260924" "$LATEX/chV2_functions.tex"
python3 tools/patch_chapter.py

echo "== 5. the gallery chapter =="
python3 tools/gen_gallery_tex.py

echo "== 6. captions and classical tables (ONCE — restyle.py is not idempotent) =="
python3 tools/restyle.py

echo "== 7. tables to the full text width =="
python3 tools/widen.py

echo "== 8. the source appendix, split so every line keeps its number =="
python3 tools/fitsource.py

echo "== 9. three XeLaTeX passes =="
cd "$LATEX"
for i in 1 2 3; do xelatex -interaction=nonstopmode main.tex > "/tmp/pass$i.log" 2>&1 || true; done
grep -E "Output written" "/tmp/pass3.log" || { echo "the compile produced no PDF — read /tmp/pass3.log"; exit 1; }

echo "== 10. acceptance check =="
cd "$ROOT"
echo "   append the 8-page 25 September addendum, then run:"
echo "   python3 tools/verify_base_plus_update_2026-09-27.py"
echo
echo "built: $LATEX/main.pdf"
