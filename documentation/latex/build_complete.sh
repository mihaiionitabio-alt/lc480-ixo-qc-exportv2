#!/bin/sh
# Build the complete MISSY documentation as a single PDF.
#
#   1. latexmk drives XeLaTeX over the narrative volume, repeating passes until
#      the table of contents, the list of figures and every cross-reference
#      have settled.  That is the part that genuinely needs the multi-pass loop.
#   2. merge_volumes.py appends the 4,962 static pages of atlas, supplement,
#      guide and annex, keeping their bookmarks.
#
# Requires: xelatex, latexmk, python3 with pypdf, and the volumes in fig/atlas/.
set -e
cd "$(dirname "$0")"
latexmk main.tex
python3 merge_volumes.py main.pdf fig/atlas \
        ../qPCR_QC_forensics_documentation_2026-10-07_complete.pdf
echo "done"
