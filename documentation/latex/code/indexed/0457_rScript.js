function rScript(){
  return `# qpcR — fit the LightCycler 480 curves and compare with the stored Cq.
#
# Input : <run>_qpcR_curves.csv  (wide; column 1 is "Cycles", one column per well)
#         <run>_cq_values.csv    (the Cq the instrument stored)
#
# install.packages("qpcR")
library(qpcR)

wide <- read.csv("REPLACE_WIDE", check.names = FALSE)
stopifnot(names(wide)[1] == "Cycles")   # pcrbatch() requires this exact name

# Fit every well with the default four-parameter log-logistic model.
ml <- modlist(wide, cyc = 1, fluo = 2:ncol(wide), baseline = "lin")

# Per-well efficiency and second-derivative-maximum Cq.
res <- pcrbatch(wide, cyc = 1, fluo = 2:ncol(wide), model = l4,
                methods = c("sigfit", "sliwin"), plot = FALSE)
write.csv(res, "qpcR_results.csv", row.names = FALSE)

# Compare qpcR's cpD2 with the Cq the instrument stored.
stored <- read.csv("REPLACE_CQ")
qcp <- data.frame(
  column = colnames(wide)[-1],
  cpD2   = sapply(ml, function(m) tryCatch(efficiency(m, plot = FALSE)$cpD2,
                                           error = function(e) NA_real_))
)
qcp$well <- sub("^.*_", "", qcp$column)
cmp <- merge(qcp, stored[, c("well", "cq")], by = "well")
cmp$difference <- cmp$cpD2 - cmp$cq
print(summary(cmp$difference))
write.csv(cmp, "qpcR_vs_stored_cq.csv", row.names = FALSE)

# A disagreement of a few tenths of a cycle is normal: qpcR fits a sigmoid to
# the raw curve while the instrument used its own baseline and threshold.
# A disagreement of several cycles means the curves and the Cq values did not
# come from the same channel, which is worth investigating before going further.
`;
}
