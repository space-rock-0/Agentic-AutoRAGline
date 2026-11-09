# Research extraction

Source: 2610.08452v1.pdf, 16 pages. Extracted with PyMuPDF 1.26.7 using get_text(), page.find_tables(), and page rendering. Raw extraction: research-website/public/research/extraction.json. Author/contact metadata is not used in the website narrative.

## Staged workflow
1. Inspect repository and brand guide; preserve existing Python code.
2. Extract complete PDF text, attempt table detection, render all pages, visually reconstruct borderless tables.
3. Define typed source-of-truth schema and map content coverage before frontend development.
4. Build isolated React frontend with responsive research narrative and interactive SVG/chart components.
5. Validate source values, build, typecheck, browser interactions, mobile layout and reduced motion.
6. Compare coverage against source and document verification limits.

## Findings
The optimizer tunes RAG configurations, not model weights. Composer prepares a frozen corpus-grounded exam; deterministic filters, sufficiency oracle and four probes select discriminative questions. Diagnoser summarizes per-question retrieval/generation evidence. Proposer combines diagnosis, model KB, history and plan to select another legal configuration. Two objectives: maximize accuracy f(c) and minimize mean API cost g(c); dominance requires weak improvement in both with one strict improvement.

Accuracy experiment: HotpotQA, MuSiQue, MultiHop-RAG, 100 validation questions and 300 disjoint held-out questions; 30 trials, 10 seeds. Existing benchmark labels are used. UniDoc Pareto experiment: 230 PDFs plus 20 images, 100 generated questions; same exam across methods/seeds, no independent held-out test reported for this experiment.

Tables 1-6: corpus sizes; complete held-out EM/F1/Judge results including SD; question taxonomy counts; 12 generator KB rows; 13 embedding rows; four reranker rows. Figure 1 architecture p3; Figure 2 validation search curves p6; Figure 3 median cost-accuracy and IQR p7; Figure 4 search cost/embedding compute p16. Original figures are retained as crops; interactive plots use exact tabulated values, never invented curve coordinates.

Results: full agent held-out judge 0.825/0.330/0.790. UniDoc median 77% at $0.000741/query; warm MO-TPE 71.5% at $0.001284; agent matches 71.5% at $0.000288. Peak seed accuracy 74%-82%; Mann-Whitney tests with Holm correction. Do not interpret these as new local runs or clinical validation.

Limitations: fixed parser, stale KB snapshot, hosted-model nondeterminism, judge bias without human agreement, limited sequential retrieval, predominantly same-document UniDoc questions. Future work: richer cross-document bridges, expanded pipeline search, more objectives, warm starts.

Brand: Poppins; #5929D0 purple, #CF008B magenta, #0F172A navy text; 4px spacing, pill buttons, 12px panels, 20px modal corners. User explicitly requires mobile beyond guide's tablet scope.

Skills applied: local taste-skill, local ui-ux-pro-max (design-system, chart and animation searches), PDF skill, diagram-generator, Sites local-preview guidance. Research graphics use actual PDF figures and interactive scientific SVG, rather than generated scientific imagery.
