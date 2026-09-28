function pyScript(){
  return `# rdmlpython / LinRegPCR — reanalyse the exported curves.
#
# Input : <run>.rdml   (RDML 1.4, written by this page)
#
# pip install lxml numpy scipy
# git clone --recursive https://github.com/RDML-consortium/rdmlpython.git
#
# The --recursive matters: the XSD schemas live in a submodule, and validate()
# raises OSError without them. LinRegPCR itself runs without the schemas.

import sys
sys.path.insert(0, "rdmlpython")     # adjust to your checkout
import rdml

doc = rdml.Rdml("REPLACE_RDML")
print("RDML version:", doc.version())   # expect 1.4 — LinRegPCR refuses anything older

for exp in doc.experiments():
    for run in exp.runs():
        result = run.linRegPCR(
            updateRDML=True,          # write efficiencies and N0 back into the document
            saveResultsCSV=True,
            pcrEfficiencyExl=0.05,    # exclude wells more than 5% off the group efficiency
            verbose=False,
        )
        csv = result.get("resultsCSV", "")
        with open("linregpcr_results.tsv", "w", encoding="utf-8") as fh:
            fh.write(csv)
        print("wells analysed:", max(0, len(csv.splitlines()) - 1))

doc.save("reanalysed.rdml")

# The columns to read first are "indiv PCR eff" (per-well efficiency) and
# "N0 (mean eff)" (starting concentration). Wells LinRegPCR excluded carry a
# reason in the "excluded" column — that column is the useful QC output here,
# because it flags curves the instrument accepted and LinRegPCR did not.
`;
}
