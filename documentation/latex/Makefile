# Build the documentation PDF (Ubuntu: see Appendix A of the PDF)
main.pdf: main.tex *.tex code/*.tex tables/*.tex fig/*.png
	latexmk -xelatex -shell-escape -interaction=nonstopmode main.tex
clean:
	latexmk -c
	rm -rf _minted-main
.PHONY: clean
