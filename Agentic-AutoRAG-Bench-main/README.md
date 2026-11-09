# Agentic AutoRAGline Benchmark Suite

[Explore the live research website and results](https://autoragline-research.vercel.app/).

Benchmark and analysis code for Agentic AutoRagline. It compares the
reasoning-agent optimizer against random search and MO-TPE (the optimizer syftr
uses) on two experiments:

- **Accuracy experiment.** Each optimizer tunes a RAG pipeline on HotpotQA,
  MuSiQue, and MultiHop-RAG, scored on a held-out gold slice of each dataset.
- **Pareto experiment.** The optimizers tune for accuracy and per-query cost
  together on UniDoc-Bench healthcare, tracing a cost-quality frontier.

**Recorded runs are included** under `experiment-1/` and `experiment-2/`.
The [results instructions](#reproduce-the-results) show how to regenerate
tables and figures from these historical runs. Once dependencies are installed,
this analysis does not require API keys or a GPU. [Rerunning from scratch](#rerun-from-scratch)
is a separate, expensive, multi-day undertaking requiring provider access.

These are historical benchmark results from the original Agentic AutoRAG
project, not results produced by a new run of this checkout.

## Contents

| Path | What it is |
|---|---|
| `agentic_autorag_bench/` | The bench package: matrix orchestrator, search methods, analysis. |
| `configs/` | One `*_paper.yaml` per Accuracy dataset, `unidoc_pareto.yaml` for the Pareto run. Each pairs with a `*_project.yaml` holding the search space and model roles. |
| `scripts/` | Result figure/table generators and the two long-run schedulers. |
| `experiment-1/<dataset>/` | Accuracy-experiment results: 3 datasets x 5 methods x 10 seeds, plus the `kb_greedy` reference and the @10/@20 checkpoints. |
| `experiment-2/unidoc/` | Pareto-experiment results: 4 methods x 10 seeds, plus the frozen exam. |
| `benchmark_data/<dataset>/` | The frozen validation exam, the stratified splits, and corpus provenance. |
| `tests/` | Benchmark test suite, including tests with mocked LLM calls. |

The optimizer is required even for the reproduction path, not only for a rerun.

## Setup

This benchmark is included in the main repository, so one clone is sufficient.
It needs Python 3.12+ and [uv](https://docs.astral.sh/uv/). The benchmark's
editable optimizer dependency currently points to `../Agentic-AutoRAG`, a
layout used by the original benchmark checkout. For the nested layout below,
change its path in `Agentic-AutoRAG-Bench-main/pyproject.toml` to `..` before
running `uv sync`:

```bash
git clone https://github.com/space-rock-0/Agentic-AutoRAGline.git
cd Agentic-AutoRAGline/Agentic-AutoRAG-Bench-main
uv sync --extra dev
uv run pytest
```

Expected layout:

```
Agentic-AutoRAGline/             <- optimizer repository
  pyproject.toml
  agentic_autorag/
  Agentic-AutoRAG-Bench-main/    <- benchmark suite
    pyproject.toml
```

The required source entry is:

```toml
[tool.uv.sources]
agentic-autorag = { path = "..", editable = true }
```

This README describes the required adjustment; it does not change the existing
dependency configuration. Updating dependencies can also change `uv.lock`.

One caveat on install size: `uv sync` pulls the optimizer's full runtime stack,
including torch, docling, sentence-transformers, lightrag, and mteb, which is
several GB. Installing dependencies may require network access. Results commands
read recorded files after the environment is ready.

## Reproduce the results

Each command reads the committed results and rewrites the artifact in place.
Run them from the repository root.

| Result | Command | Output |
|---|---|---|
| Held-out accuracy table | `uv run python scripts/paper_figures.py` | `experiment-1/figures_paper/table1_answer_quality.tex` |
| Best-so-far accuracy curves | `uv run python scripts/best_so_far_figure.py` | `experiment-1/figures_paper/best_so_far_3panel.pdf` |
| Cost-accuracy frontier | `uv run agentic-autorag-bench pareto -c configs/unidoc_pareto.yaml --figure-only` | `experiment-2/unidoc/figures/pareto_cost_accuracy_median.pdf` |
| Search cost and embedding tokens | `uv run python scripts/paper_figures.py` | `experiment-1/figures_paper/cost_and_embeddings.pdf` |
| Significance results | `uv run python scripts/exp2_significance.py` | `experiment-2/unidoc/significance.md` (also printed) |
| Per-dataset `Table_1.md` + matrix figures | `uv run agentic-autorag-bench analyze --results-dir experiment-1/hotpot` | `experiment-1/hotpot/figures/` |

The historical `table1_answer_quality.tex` and `Table_1.md` filenames contain
the held-out accuracy results. `paper_figures.py` also
emits `score_per_trial_3panel.pdf` and `answer_quality.pdf`, and
`pareto --figure-only` rewrites the whole `experiment-2/unidoc/figures/` set and
`hypervolume.json`. Repeat the `analyze` command
with `--results-dir experiment-1/musique` and `experiment-1/multihop` for the
other two datasets. Timings depend on the machine and installed environment.

Two additional summaries can be derived from recorded data rather than emitted
by a script:

```bash
# Corpus summary, first three datasets (UniDoc is measured on the
# downloaded corpus, see "Rerun from scratch")
uv run python -c "
import json,pathlib
for d in ['hotpot_val_2000','musique_val_2417','multihop_rag_val']:
    m=json.loads(pathlib.Path(f'benchmark_data/{d}/metadata.json').read_text())
    print(f\"{m['name']:<14} {m['corpus_doc_count']:>6} docs  {m['corpus_total_words']/1e6:.2f}M words  {m['corpus_avg_words_per_doc']:.0f} w/doc\")"

# UniDoc question-type counts
uv run python -c "
import json,collections
ex=json.load(open('experiment-2/unidoc/.shared_cache/exam.json'))
print(collections.Counter(q['reasoning_type'] for q in ex), 'total', len(ex))"
```

### Verifying the evaluation set is the one that produced the results

The frozen exam records a SHA-256 of the optimization pool it was drawn from, so
the committed exam and the committed splits can be checked against each other:

```bash
uv run python -c "
import hashlib,json,pathlib
for d in ['hotpot_val_2000','musique_val_2417','multihop_rag_val']:
    pool=json.loads(pathlib.Path(f'benchmark_data/{d}/splits/optimization_qa.json').read_text())
    got=hashlib.sha256(json.dumps(pool,sort_keys=True).encode()).hexdigest()
    want=json.loads(pathlib.Path(f'benchmark_data/{d}/validation_exam_provenance.json').read_text())['qa_sha256']
    print(d, 'MATCH' if got==want else 'MISMATCH')"
```

## Methods

| Key | Description |
|-----|-------------|
| `agentic_score` | Reasoning-loop optimizer, tuning for accuracy. The accuracy experiment's method under test. |
| `agentic_cost` | Optimizer in cost-aware mode, tuning accuracy and cost together. The Pareto experiment's method under test. |
| `agentic_nokb_nodiag` | Score-only ablation without the knowledge base or diagnosis, using compact config-to-score history. |
| `random` | Random search. Also the transfer source that seeds `motpe_warm`. |
| `motpe` | Optuna group-multivariate MO-TPE, cold. The syftr-class statistical baseline. |
| `motpe_warm` | The same MO-TPE, warm-started from this run's paired `random` trials as a free, uncounted prior. |
| `agentic_nokb`, `agentic_nodiag` | Single-component ablations. Implemented via `configs/hotpot_ablation.yaml`, but not included in the recorded main results. |
| `qlognehvi` | A GP-BO reference (Barker et al.), not run in the recorded results. Needs `uv add ax-platform`. |

All methods search the same pipeline space and are scored the same way, so their
results compare directly. The agentic methods share one optimizer class and
differ only by config flags. The two MO-TPE methods share another class, with a
flag selecting accuracy-only or accuracy-and-cost mode. Their settings match
syftr's published optimizer, checked by an equivalence test.

## Output layout

Both experiments use the same per-pair layout.

```
experiment-1/hotpot/                     # = output_root from the config
  bench_metadata.json                    dataset, hf_revision, methods, seeds, budget,
                                         and the optimizer version + commit that ran it
  filtered_questions.json                questions excluded from every method's denominator
  .shared_cache/                         parsed corpus, chunks, embeddings (regeneratable, not committed)
  figures/                               cross-method figures + Table_1.md
  figures_paper/                         historical cross-dataset figures + table1_answer_quality.tex
  <method>/seed_<n>/
    benchmark_results.json               held-out score of the best config, with per-question rows
    best_config.yaml                     the selected pipeline
    recommended.yaml                     the optimizer's recommended pick
    search_result.json                   search-level summary
    optimizer_meta.json                  totals: trials, tokens, USD, wall-clock
    wall_clock.json                      wall-clock for the non-agentic methods
    frontier/trial_NN.yaml               Pareto-frontier configs
    figures/                             per-seed score/cost curves
    details/history.jsonl                per-trial config, score, tokens, cost, and agent diagnosis
    details/trial_cost_ledger.jsonl      per-call cost ledger
    details/cost_breakdown.json          optimizer-vs-trial cost split
    run.log                              full console log, including every agent prompt.
                                         Produced by a rerun only: log files are gitignored,
                                         so no run.log ships with the committed results.
```

`<method>@<k>/seed_<n>/` directories (e.g. `agentic_score@10/`) hold the
early-stopping checkpoints: the best config within the method's first *k* trials,
scored on the same held-out slice. They allow comparison of earlier trial budgets.

Experiment 2 is the same, under `experiment-2/unidoc/<method>/seed_<n>/`, with
two differences: there is no `benchmark_results.json` (UniDoc has no gold answer
set, so trials are scored on the optimizer's own frozen exam), and the exam
itself is committed at `experiment-2/unidoc/.shared_cache/exam.json`.

## Rerun from scratch

Rerunning may yield different findings and numbers. See
[What is and is not reproducible](#what-is-and-is-not-reproducible). Budget
several days and a substantial API budget. The historical runs listed below
totaled about \$1,165 before exam generation; current costs can differ.

### Credentials

A full rerun spans four providers. `.env.example` documents every variable.
Copy it to `.env` and fill in the four groups below.

**A `.env` file on disk is not enough.** LiteLLM reads credentials from the
process environment, and neither the bench CLI nor `uv run` loads `.env`
automatically. Export it into the shell before every run, either

```bash
export UV_ENV_FILE=.env        # uv loads it for every `uv run` in this shell
```

or

```bash
set -a; . ./.env; set +a       # plain shell export
```

Whichever you use, apply it in the same shell that launches the schedulers, so
the `(method, seed)` subprocesses inherit it.

| Provider | Prefix | Used for | Variables |
|---|---|---|---|
| AWS Bedrock | `bedrock/` | Examiner (`minimax.minimax-m2.5`), optimizer agent (`moonshotai.kimi-k2.5`), and most generators | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION_NAME` |
| Azure OpenAI | `azure/` | GPT-family generators | `AZURE_API_KEY`, `AZURE_API_BASE` |
| Azure AI Foundry | `azure_ai/` | The judge (`DeepSeek-V3.2`) | `AZURE_AI_API_KEY`, `AZURE_AI_API_BASE` |
| Google Vertex AI | `vertex_ai/` | Gemini generators | `VERTEXAI_PROJECT`, `VERTEXAI_LOCATION`, `GOOGLE_APPLICATION_CREDENTIALS` |

**Azure deployment names are per-subscription.** Each `configs/*_project.yaml`
carries a `model_aliases:` block mapping the config's model strings to the
deployment names from the original subscription:

```yaml
model_aliases:
  azure/gpt-5-nano: azure/gpt-5-nano-1
  ...
```

Re-point those to your own deployments. Verify the whole search space is
reachable before committing to a multi-day run:

```bash
uv run python scripts/preflight_search_space.py configs/hotpot_paper_project.yaml --env .env
```

(This script is the one place that *does* read a `.env` directly. Without
`--env` it looks for a sibling `../Agentic-AutoRAG/.env` relative to the
original layout, so pass an explicit path for this nested checkout.)

`run` pings every endpoint in the search space before the first trial and aborts
if any one of them fails, so an unreachable model stops the run at startup
rather than partway through.

One model has been renamed since the experiments: the runs used
`vertex_ai/gemini-3.1-flash-lite-preview`, which Google
[shut down on 2026-05-25](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-preview)
when the model went GA as `vertex_ai/gemini-3.1-flash-lite`. The configs name
the GA ID so a rerun works. The committed results still record the preview ID,
which is what the runs actually called.

Rebuilding the frozen validation exams also uses Google AI Studio
(`gemini/`, `GEMINI_API_KEY`) as the span extractor. The exams are committed,
so a rerun does not need it.

### Rebuild the corpora

The corpora are large and regeneratable, so they are not committed. The pinned
HuggingFace revision is. `run` prepares them automatically from the
`benchmark.hf_revision` in each config, but you can do it explicitly:

```bash
uv run agentic-autorag benchmark-prepare hotpot_qa \
  -o ./benchmark_data/hotpot_val_2000 --split validation \
  --sample-size 2000 --seed 42 --hf-revision 1908d6afbbead072334abe2965f91bd2709910ab

uv run agentic-autorag benchmark-prepare musique \
  -o ./benchmark_data/musique_val_2417 --split validation \
  --sample-size 2417 --seed 42 --hf-revision c8f4f8c9465fb69d31a8eae894c3fd509c4ca321

# MultiHop-RAG ships HuggingFace *configs*, not splits: --split names the config,
# and the default `validation` errors out.
uv run agentic-autorag benchmark-prepare multihop_rag \
  -o ./benchmark_data/multihop_rag_val --split MultiHopRAG \
  --sample-size 2000 --seed 42 --hf-revision 71ac0d0bd1f951d2d6b70311f7d2ae404e1ffa82
```

Each writes a fresh `metadata.json`. Check `corpus_doc_count` and
`corpus_total_words` against the committed values. Those are the numbers in the
recorded corpus summary, and a mismatch means the corpus differs from the original. The
committed `splits/` and `validation_exam.json` are left alone, so the evaluation
set stays fixed regardless.

The UniDoc corpus (230 healthcare PDFs plus 20 page images, ~336 MB) downloads
automatically on the first `pareto` run from `Salesforce/UniDoc-Bench`, pinned to
the revision the experiments used (`_REVISION` in
`agentic_autorag_bench/unidoc_corpus.py`). Both the file fetches and the image
listing are pinned, so the same 250 files come back regardless of when it runs.

### Accuracy experiment

3 datasets x 5 methods x 10 seeds at 30 trials each, plus a `kb_greedy`
reference. `scripts/run_experiment1.py` runs each (method, seed) pair as its own
subprocess, keeps at most 2 running, starts `motpe_warm` only after its paired
`random` finishes, and writes each dataset's `Table_1.md` at the end.

```bash
uv run python scripts/run_experiment1.py --dry-run --include-kb-greedy   # preview the DAG

mkdir -p experiment-1/logs
setsid nohup uv run python scripts/run_experiment1.py --include-kb-greedy \
    > experiment-1/logs/nohup.out 2>&1 &

tail -f experiment-1/logs/scheduler.log
cat experiment-1/logs/STATUS.json
```

Or drive one dataset directly:

```bash
uv run agentic-autorag-bench run -c configs/hotpot_paper.yaml                    # full matrix
uv run agentic-autorag-bench run -c configs/hotpot_paper.yaml -m agentic_score   # one method
uv run agentic-autorag-bench run -c configs/hotpot_paper.yaml --resume           # continue after a stop
uv run agentic-autorag-bench kb-greedy -c configs/hotpot_paper.yaml --seed 1     # the no-search reference
```

### Pareto experiment

4 methods x 10 seeds at 30 trials on UniDoc-Bench healthcare. There is no gold
answer set, so the optimizer generates its own exam and uses it as both tuning
target and score, and every method also minimizes per-query LLM cost.
`scripts/run_experiment2.py` builds the shared setup (download and parse the
corpus, then load the committed frozen exam), runs the 40 pairs with the same
2-worker and `motpe_warm`-after-`random` rules, and renders the figures and
`hypervolume.json`.

```bash
uv run python scripts/run_experiment2.py --dry-run

mkdir -p experiment-2/logs
setsid nohup uv run python scripts/run_experiment2.py --workers 2 \
    > experiment-2/logs/nohup.out 2>&1 &
```

### Ablations

The `agentic_nokb_nodiag` ablation is part of the main matrix above. The
single-component decomposition was not included in those results. To run it:

```bash
uv run agentic-autorag-bench run -c configs/hotpot_ablation.yaml
```

It reuses the headline's project YAML and frozen exam, and writes to its own
`experiment-1/hotpot_ablation/`.

### Rerun ergonomics

- **Completion is read from disk, not exit codes.** A scheduler that stops for
  any reason resumes correctly by re-running the same command, and finished pairs
  are skipped. This also means the *committed* results read as already done, so a
  genuine rerun needs a fresh `output_root`. **Redirect both configs**, not just
  the matrix one. The project YAML's `meta.output_dir` is a second, independent
  path, and leaving it alone makes a rerun write its parsed corpus and index
  cache (tens of GB over a full matrix) into the committed `experiment-1/`
  tree:
  ```bash
  sed 's|^output_root: .*|output_root: ./rerun-1/hotpot|' \
      configs/hotpot_paper.yaml > configs/hotpot_rerun.yaml
  sed 's|^  output_dir: .*|  output_dir: "./rerun-1/hotpot/.shared_cache"|' \
      configs/hotpot_paper_project.yaml > configs/hotpot_rerun_project.yaml
  sed -i 's|^project_config: .*|project_config: ./hotpot_rerun_project.yaml|' \
      configs/hotpot_rerun.yaml
  uv run agentic-autorag-bench run -c configs/hotpot_rerun.yaml
  ```
  `project_config` is resolved relative to the config file, so a copy that stays
  in `configs/` needs no path juggling.
- **`--clean` refuses to destroy finished work.** A fresh `run` defaults to
  cleaning the method dirs it is about to write, but it will not delete dirs that
  already hold completed hold-out results. Pass `--resume` to continue, or
  `--force` to deliberately restart.
- **Do not raise `--workers` above 2.** That is the most the API endpoints handle
  reliably. Higher settings produce throttling errors that corrupt a run's cost
  and coverage accounting rather than just slowing it down.
- **GPU.** Index building and embedding run on the local GPU when one is present.
  A rerun works on CPU but is considerably slower.

### Cost and wall-clock

Measured from the committed runs (`optimizer_meta.json`), excluding
exam generation:

| | Search USD | Compute-hours | Wall-clock at 2 workers |
|---|---|---|---|
| Accuracy, HotpotQA | \$209 | 52 | ~26 h |
| Accuracy, MuSiQue | \$313 | 54 | ~27 h |
| Accuracy, MultiHop-RAG | \$384 | 58 | ~29 h |
| Held-out scoring (240 evals, all 3) | \$125 | | |
| Pareto, UniDoc | \$134 | 35 | ~18 h |
| **Total** | **\$1,165** | **199** | **~100 h** |

## What is and is not reproducible

Fixed by construction, because they are committed: the validation exams, the
stratified held-out slices, the UniDoc exam, the search space, the seeds, and
the pinned dataset revisions. Sampling variation is therefore not a source of
run-to-run difference.

Not fixed: hosted LLM generation and LLM judging are nondeterministic, and the
hosted models themselves are versioned by the provider and change over time. A
rerun may differ in both the numbers and the ordering of methods; the historical
results do not guarantee that the same findings will recur.

## Notes

- **Cost accounting.** Only the agentic methods generate an exam, and the others
  reuse it. To keep the comparison fair, the cost tally excludes the tokens spent
  generating the exam.
- **Abstention.** MultiHop-RAG includes unanswerable questions, about 12% of the
  set. A system that abstains is scored correct, one that answers anyway is
  scored wrong. These count toward answer accuracy but not retrieval metrics,
  since there are no documents to retrieve.
- **Cross-method exclusion.** If any method's hold-out eval hits a provider
  content filter on a question, that question is dropped from *every* method's
  denominator, so all methods are scored on the same question set. The union is
  recorded in `filtered_questions.json`.
- **Provenance.** The historical results record the optimizer version and commit
  in `bench_metadata.json`; the original documentation identifies commit
  `dbb9b7e` for those runs. This checkout may differ. Do not assume a fresh run
  will match the recorded results.
- The earlier AutoRAG baseline was removed from the active matrix and is kept
  under `agentic_autorag_bench/_deprecated/`.

## License

MIT, see `LICENSE`.
