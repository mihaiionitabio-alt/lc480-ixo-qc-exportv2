# The font this document is built with

The document is typeset with **Microsoft YaHei** (`msyh.ttc`) as its main, sans and monospace
family. That font is proprietary and ships with Windows; it is **not** in this repository and must
not be redistributed here.

To build the document, put a copy at `docs/latex/fonts/msyh.ttc`.

On Windows it is already on the machine:

```powershell
Copy-Item C:\Windows\Fonts\msyh.ttc docs\latex\fonts\
```

Elsewhere, or if you would rather not use it, any CJK-capable family works. The document needs one
because the page carries a Chinese interface dictionary that the source appendix prints, and because
the listings must render ideographs in a monospace face. Substitutes that are free to redistribute:

- **Noto Sans CJK** / **Noto Sans Mono CJK** — `sudo apt install fonts-noto-cjk` on Debian or Ubuntu
- **Source Han Sans** / **Source Han Mono** — Adobe, SIL Open Font License

To use one, edit the three `\setmainfont` / `\setsansfont` / `\setmonofont` lines at the top of
`docs/latex/main.tex`. Line breaking, page count and the figure numbers will shift a little; the
acceptance check in `tools/verify_base_plus_update_2026-09-27.py` asserts an exact page count, so
adjust that number if you change the font.
