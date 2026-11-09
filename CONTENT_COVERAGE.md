# Content coverage and source-of-truth contract

Frontend source data: research-website/src/research.json, generated reproducibly by tools/prepare.py. Data types: src/schema.ts. Numeric null means unpublished; no replacement by zero. Raw values remain fractions; UI percentages multiply by 100 and retain precision. SD is labeled SD, not confidence interval. Every data group has a source table/page or section. Figures retain captions and source page.

| Research element | Source | Website destination |
|---|---|---|
| Problem and three contributions | pp1-2 | Overview / Why diagnosis |
| Related work categories | pp2-3 | Context |
| Problem formulation and Pareto dominance | p3 | Objectives / playground |
| Composer, neighborhoods, validation, probes | pp3-4 | Exam methodology |
| Diagnoser, Proposer, history and KB | pp4-5 | Interactive architecture |
| Figure 1 | p3 | Architecture source viewer |
| Corpus Table 1 | p5 | Data |
| Evaluation protocol and all baselines | pp5-6 | Experiments |
| Figure 2 | p6 | Original figures gallery |
| All Table 2 means and SDs | p7 | Metric explorer and full table |
| Figure 3, cost and significance | pp7-8 | Trade-offs and source gallery |
| Limitations and future work | pp8-9 | Boundaries |
| Seven question types and Table 3 | pp11-12 | Exam taxonomy, examples |
| Appendix B complete configuration | pp13-14 | Search space expandable listing |
| Tables 4, 5, 6 | p15 | Knowledge-base searchable tables |
| Figure 4 and Appendix D | p16 | Compute and source gallery |
| Conclusion | p8 | Final takeaway |
| Bibliographic references | pp9-10 | Collapsible title-only bibliography; author contact details omitted |

Interactive controls: dataset, metric, checkpoint, sort, model search, figure viewer with zoom, architecture selection, drag/pan with keyboard alternatives, play/pause/step/reset; accuracy threshold against three explicitly identified reported UniDoc operating points. No live LLM or fabricated optimizer runs.

Verification results are recorded in research-website/VERIFICATION.md. All listed destinations are implemented. Automated source-data and browser interaction checks pass; no coverage claim implies independent reproduction of the experiments.
