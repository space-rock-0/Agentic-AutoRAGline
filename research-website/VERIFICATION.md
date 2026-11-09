# Verification

## Research fidelity
- PyMuPDF 1.26.7 extracted all 16 pages and executed `page.find_tables()` on every page.
- Borderless source tables were reconstructed against rendered pages: all 6 tables, 8 method rows x 3 datasets x 3 metrics with mean/SD, 12 generator rows, 13 embedding rows, 4 reranker rows.
- All 4 original figures are available in the source gallery. Their numerical curve samples are not invented or reverse-engineered.
- Exact numeric data lives in `src/research.json`; missing benchmark values stay null and display as unpublished.
- The 100/300 validation-test distinction, 10 seeds, 30 trials, warm-start prior, ablation qualification, significance tests, generated UniDoc exam limitation, historical pricing and independent infrastructure costs are stated.
- The playground is labeled as a lookup over 3 reported operating points; architecture playback is labeled explanatory.

## Automated checks
- `npm test`: 4 tests passed (table/figure completeness, held-out values and SD, taxonomy sum and nulls, original assets).
- `npm run lint`: passed after removing one unused import.
- `npm run typecheck`: passed.
- Production build: final rebuild passed (Vite, 461.53 kB JavaScript / 146.85 kB gzip). Motion's client-directive notices are non-fatal in this client-side build.
- Playwright with installed Microsoft Edge: passed on 1440, 1024, 768 and 375px viewports.
- Browser coverage: navigation, metric/dataset/checkpoint selectors, architecture play/pause/reset and keyboard movement, operating threshold and empty state, figure modal/zoom/close, table filters and no-results state, dark theme, reduced motion, and console error checks.
- No document-level horizontal overflow at tested responsive widths.
- Desktop, mobile and dark screenshots inspected locally. Screenshots are ignored under `test-results/`.

## Limits
- These checks verify the website, not reproduction of expensive LLM experiments.
- Original bibliography and appendices are extracted text; PDF column order can create awkward line wrapping in expanded excerpts. Tables and narrative do not depend on that text ordering.
- Native computer-use initialization failed; browser verification used Playwright/Edge instead.
- Installation reported 7 moderate dependency advisories. The later npm audit endpoint was unavailable; a clean dependency-security audit is not claimed.
- Production deployed on Vercel: https://autoragline-research.vercel.app/ . Source commit: `b69c7ff9bd7e966184d43fb1bea6364070cbc2bb`; deployment: `dpl_ArDob6uJFi1xWL8mwMXUxxCqMT4e`.
- Live smoke verification passed: public HTTP 200, expected page title, working dataset selector and original-figure modal, zero browser console errors. The live check uses `tools/live-smoke.mjs` with the HTTPS URL.
- Scientific diagrams and actual PDF figures take precedence over skill suggestions to generate decorative images. No generated images or invented scientific plots were used.
