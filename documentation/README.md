# qPCR QC and forensics documentation

Updated 22 September 2026 (evening revision b): the manual was recompiled against the current release HTML (`qpcr_qc_forensics.html`, 8723 lines).

- **qPCR_QC_forensics_documentation_2026-09-22d.pdf — current manual, 120 pages.** The source master retains the
  comparisons, validation and limits, landscape atlas, build appendix and appended A4 atlas inputs. If a local PDF was
  produced before the source restoration, rebuild it from `documentation_sources/latex/main.tex`; the separate A4 and A3
  landscape atlases remain available alongside the manual.
- **qPCR_QC_forensics_documentation_2026-09-22b.pdf — current manual (129 pages + the 197-page A4 atlas appended, 326 pages).**
  - all code listings renumbered to the current HTML line numbers (80 listings were 6 or 17 lines out of date);
  - function index (Appendix B) and the module map in Chapter 3 regenerated from the current file;
  - new sections in the Control panel chapter: signal classes (limit versus pattern), default rule set for
    plate-dependent series, control series per material with one segment per extract, sustained-shift detection
    with the proposed re-baseline, and the trend-slope significance test;
  - Chapter 7 states that `Start from` now offers only the SC SOP-06 profile;
  - every control-chart figure redrawn by the application itself from the real-scale synthetic history.

Updated 22 September 2026: revised manual, real-scale synthetic demonstration data, and complete landscape graph atlases.

- qPCR_QC_forensics_documentation_2026-09-22.pdf — revised A4 manual with regenerated real-scale demonstration figures and the complete A4 landscape chart atlas appended.
- qPCR_control_charts_realscale_A4_landscape.pdf — all 197 exported chart pages, formatted for A4 landscape printing.
- qPCR_control_charts_realscale_A3_landscape.pdf — the same 197 charts at A3 landscape size for presentations.
- documentation_sources.zip — standalone LaTeX sources, figures, code snapshot and synthetic outputs.
- documentation_sources/latex/main.tex — editable master document.
- documentation_sources/README.md — build and regeneration instructions.
- ENGINEERING_HARDENING_2026-09-22.md — implemented lifecycle, input-boundary and diagnostic checks.
- JERG_RECOMMENDATION_REVIEW_2026-09-23.md — applicability review of the attached software-development PDF.
- DESIGN_IMPROVEMENTS_2026-09-23.md — lifecycle, boundary and local diagnostics design updates in release `2026.09.23.hardening2.
- CLAUDE_DATA_CONSOLE_ARCHITECTURE_PLAN_2026-09-23.md — staged plan for the readable data-console redesign and verification.
- The manual is written as technical documentation: figure captions and short reading notes explain navigation and interpretation; longer prose is reserved for image interpretation and method boundaries.
- REVISION_SIGNAL_FIX_REALSCALE_2026-09-22.md — Claude proposal implementation and output notes.
- backups/before_control_corrections — original delivered files.

The laboratory control-mapping preset is review-only; load and verify the approved laboratory JSON before using acceptance decisions.

The release now starts new `SC_` experiments from the SC-06 laboratory profile. The reusable profile is [SC_SOP-06_profile.json](D:/IXO/release_unified_2026-09-21_r2/documentation/control_mapping_review/SC_SOP-06_profile.json); the original proposal remains [proposed_control_mapping.json](D:/IXO/release_unified_2026-09-21_r2/documentation/control_mapping_review/proposed_control_mapping.json). The graph export also includes review data for the plate map, sample comparison, statistics, control charts, runs/QC, amplification curves and instrument records.

Control-chart alarms are shown in the Control panel (Tab 4) and are not duplicated in Quality & forensic review (Tab 6). Tab 6 remains focused on integrity, timeline, analysis-membership, stored-call and SOP interpretation findings.

The seven-tab order is Load files, SOP, Results, Control panel, Graphs, Quality & forensic review, and Open formats. Stored-value downloads remain under Open formats; the separate Stored values tab was removed.




- `..\console_variants_2026-09-23\` — 30 runnable layout variants generated from the unchanged analysis page; `console_variants_2026-09-23.zip` bundles them for comparison.


- SOFTWARE_DESIGN_VIEWS_UML_DFD_2026-09-23.md — UML/IEEE-style design views and Yourdon/Coad data-flow source for the HTML modules and optional Java boundary.
- software_design_views_A3_landscape.pdf — four-page A3 landscape architecture and sequence diagram book; editable source is software_design_views_A3.html.


## 2026-09-23 design-view update

The PDF qPCR_QC_forensics_documentation_2026-09-22d.pdf was rebuilt from the current production HTML. Appendix D contains composition, activity and sequence views plus a generated flow record for each function-index entry; the A3 design plates are embedded for presentation use. The production HTML is unchanged by this documentation build.

