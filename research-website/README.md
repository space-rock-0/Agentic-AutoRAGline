# AutoRagline research website

An isolated, frontend-only React + TypeScript + Vite companion to the supplied research PDF. The existing optimizer and benchmark code are untouched.

## Run

From `research-website/`:

```sh
npm install
npm run dev
```

Open the printed local URL, normally http://127.0.0.1:5173. Build a static deployment with `npm run build`; publish `dist/` to any static host. No API keys or backend are needed.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
node tools/browser-test.mjs
```

The browser script uses installed Microsoft Edge via Playwright and a running local dev server. It writes screenshots and test results to the ignored `test-results/` directory. It requires Edge; adapt the channel if using another installed Chromium browser.

## Source-of-truth content

- `src/schema.ts`: typed table, result, figure and source records.
- `src/research.json`: exact table transcriptions, figure captions and source excerpts.
- `tools/extract.py`: PyMuPDF full-page text, `find_tables()` attempts, and page renders.
- `tools/prepare.py`: visually verified reconstruction of borderless tables and original figure crops.
- Root `RESEARCH_EXTRACTION.md` and `CONTENT_COVERAGE.md`: staged workflow and source-to-section mapping.

To rerun PDF tools, install `pymupdf==1.26.7` into `.vendor/` and run them with Python 3.12+. The PDF remains in the parent repository. These tools generate files only inside this website.

## Implementation

Named components in `src/main.tsx` isolate table search/sort, architecture interaction, metric comparison, the operating-point playground and narrative sections. Semantic CSS tokens map the supplied brand guidelines to light/dark modes. Poppins fonts are bundled locally. Motion handles reveal transitions with reduced-motion support; SVG implements research diagrams and measured plots. Phosphor provides interface icons.

The architecture playback is explanatory. The playground selects among three reported median-curve operating points; it does not infer new scores. Source figures preserve plotted curves rather than fabricating numerical samples. Recorded results are attributed to the study and are not presented as newly reproduced runs.
