# Rebuild the 28 September 2026 documentation on Windows.
#   powershell -ExecutionPolicy Bypass -File tools\build.ps1
$ErrorActionPreference = 'Stop'
$ROOT  = Split-Path -Parent $PSScriptRoot
$LATEX = Join-Path $ROOT 'docs\latex'
$PAGE  = Join-Path $ROOT 'page\index_interactive_2026-09-27.html'
Set-Location $ROOT

if (-not (Test-Path "$LATEX\fonts\msyh.ttc")) { throw "missing $LATEX\fonts\msyh.ttc - see docs\fonts\README.md" }

Write-Host '== 1. parse the page =='            ; node tools\extract2.mjs $PAGE
Write-Host '== 2. software diagrams =='         ; python tools\gen_diagrams.py
if (Test-Path "$ROOT\demo-data") {
  Write-Host '== 3. captures =='                ; python tools\shoot.py; python tools\shoot2.py
                                                  python tools\shoot3.py; python tools\shoot4.py
} else { Write-Host '   demo-data\ not present - Chapter 20 will be skipped' }
Write-Host '== 4. Chapter 19 =='
Copy-Item "$LATEX\chV2_functions.tex.before_singlecolumn_20260924" "$LATEX\chV2_functions.tex" -Force
python tools\patch_chapter.py
Write-Host '== 5. gallery =='                   ; python tools\gen_gallery_tex.py
Write-Host '== 6. captions and tables (ONCE) ==' ; python tools\restyle.py
Write-Host '== 7. full-width tables =='         ; python tools\widen.py
Write-Host '== 8. source appendix =='           ; python tools\fitsource.py
Write-Host '== 9. three XeLaTeX passes =='
Set-Location $LATEX
1..3 | ForEach-Object { xelatex -interaction=nonstopmode main.tex | Out-Null }
Write-Host "built: $LATEX\main.pdf"
