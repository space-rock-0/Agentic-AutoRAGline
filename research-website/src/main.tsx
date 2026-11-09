import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Play,
  Pause,
  ArrowCounterClockwise,
  Plus,
  Minus,
  Sun,
  Moon,
  List,
  X,
  Download,
  GitBranch,
  Database,
  FlowArrow,
  Check,
  Info,
} from "@phosphor-icons/react";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import raw from "./research.json";
import type { Research, SourceTable } from "./schema";
import "./style.css";
const data = raw as Research;
const datasets = ["HotpotQA", "MuSiQue", "MultiHop-RAG"];
const metricNames = ["Exact match", "Token F1", "LLM judge"];
const fmt = (v: number) => `${(v * 100).toFixed(1)}%`;
function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.div>
  );
}
function Table({ table }: { table: SourceTable }) {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState(-1),
    [asc, setAsc] = useState(true);
  let rows = table.rows.filter((row) =>
    row.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  if (sort >= 0)
    rows = [...rows].sort(
      (a, b) =>
        String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""), undefined, {
          numeric: true,
        }) * (asc ? 1 : -1),
    );
  return (
    <div className="table-block">
      <div className="table-top">
        <h3>{table.title}</h3>
        <label className="search">
          Filter rows
          <input
            aria-label={`Filter ${table.title}`}
            placeholder="Search this table"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={table.title}
      >
        <table>
          <caption>
            {table.id.toUpperCase()} / Source page {table.page}
          </caption>
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  aria-sort={
                    sort === i ? (asc ? "ascending" : "descending") : "none"
                  }
                >
                  <button
                    onClick={() => {
                      setAsc(sort === i ? !asc : true);
                      setSort(i);
                    }}
                  >
                    {h} {sort === i ? (asc ? "↑" : "↓") : "↕"}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j}>{c === null ? "Not published" : String(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="empty">No matching rows. Try a model or metric name.</p>
        )}
      </div>
      <p className="caption">{table.note}</p>
    </div>
  );
}
const nodes = [
  {
    name: "Corpus + search space",
    x: 30,
    y: 75,
    detail:
      "User-provided documents and legal configuration ranges are inputs to the system. The parser is fixed; chunking and downstream stages can change.",
  },
  {
    name: "Build neighborhoods",
    x: 260,
    y: 40,
    detail:
      "Pair anchor chunks with same-document siblings and cross-document chunks ranked by TF-IDF cosine similarity.",
  },
  {
    name: "Composer",
    x: 480,
    y: 40,
    detail:
      "Draft open-ended questions, canonical answers and verbatim gold spans. The Composer over-generates so filtering can reduce the candidate pool.",
  },
  {
    name: "Validate + oracle",
    x: 700,
    y: 40,
    detail:
      "Reject duplicate citations, empty spans, source-dependent phrasing and arithmetic errors. The sufficiency oracle checks whether the proposed hops are necessary.",
  },
  {
    name: "Four probes",
    x: 700,
    y: 175,
    detail:
      "Evaluate candidate questions with four pipelines spanning the search space. Discard questions every probe solves; favor discriminative items.",
  },
  {
    name: "Frozen exam",
    x: 480,
    y: 175,
    detail:
      "A fixed evaluation target makes trials comparable. Existing labeled QA can bypass exam generation entirely.",
  },
  {
    name: "Evaluate pipeline",
    x: 480,
    y: 340,
    detail:
      "Build or load the index, answer every exam question, score answers and record whether all required gold spans were retrieved.",
  },
  {
    name: "Diagnoser",
    x: 700,
    y: 340,
    detail:
      "Compress per-question retrieval and generation evidence into a diagnosis. It does not prescribe changes or see costs and rival configurations.",
  },
  {
    name: "Proposer",
    x: 260,
    y: 340,
    detail:
      "Combine the diagnosis with current configuration, history, remaining budget and model knowledge. Emit a new configuration, rationale and carried-forward plan.",
  },
  {
    name: "Model knowledge base",
    x: 30,
    y: 340,
    detail:
      "Public model rankings, prices and serving attributes help the Proposer identify strong and cheap options before spending a trial.",
  },
  {
    name: "Recommendation",
    x: 260,
    y: 490,
    detail:
      "After the user-defined trial budget, return a recommended configuration, Pareto frontier in cost-aware mode and a reasoning trace.",
  },
];
const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [9, 8],
  [0, 8],
  [8, 6],
  [6, 7],
  [7, 8],
  [8, 10],
];
function Architecture() {
  const [selected, setSelected] = useState(0),
    [playing, setPlaying] = useState(false),
    [scale, setScale] = useState(1);
  const [positions, setPositions] = useState(
    nodes.map((n) => ({ x: n.x, y: n.y })),
  );
  const drag = useRef<{
    i: number;
    x: number;
    y: number;
    px: number;
    py: number;
  } | null>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () => setSelected((v) => (v + 1) % nodes.length),
      1800,
    );
    return () => clearInterval(id);
  }, [playing]);
  const reset = () => {
    setPositions(nodes.map((n) => ({ x: n.x, y: n.y })));
    setScale(1);
    setSelected(0);
    setPlaying(false);
  };
  return (
    <div className="architecture">
      <div className="canvas-head">
        <span>
          <FlowArrow size={20} /> An inspectable reasoning loop
        </span>
        <div className="controls">
          <button
            aria-label={playing ? "Pause architecture" : "Play architecture"}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            aria-label="Zoom out architecture"
            onClick={() => setScale((v) => Math.max(0.7, v - 0.1))}
          >
            <Minus />
          </button>
          <button
            aria-label="Zoom in architecture"
            onClick={() => setScale((v) => Math.min(1.4, v + 0.1))}
          >
            <Plus />
          </button>
          <button aria-label="Reset architecture" onClick={reset}>
            <ArrowCounterClockwise />
          </button>
        </div>
      </div>
      <div className="canvas-scroll">
        <svg
          className={playing && !reduce ? "flow playing" : "flow"}
          viewBox={`0 0 ${940 / scale} ${610 / scale}`}
          aria-label="Interactive architecture: corpus to exam and diagnose-propose optimization loop"
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0 0L8 4L0 8" fill="var(--purple)" />
            </marker>
          </defs>
          <text x="260" y="20" className="boundary">
            EXAM GENERATION
          </text>
          <text x="260" y="310" className="boundary">
            OPTIMIZATION LOOP
          </text>
          {edges.map(([a, b], i) => {
            const p = positions[a],
              q = positions[b];
            return (
              <path
                key={i}
                className="edge"
                markerEnd="url(#arrow)"
                d={`M${p.x + 90} ${p.y + 35} C${p.x + 90} ${q.y + 35},${q.x + 90} ${p.y + 35},${q.x + 90} ${q.y + 35}`}
              />
            );
          })}
          {nodes.map((n, i) => (
            <g
              key={n.name}
              tabIndex={0}
              role="button"
              aria-label={n.name}
              aria-pressed={selected === i}
              transform={`translate(${positions[i].x},${positions[i].y})`}
              className={`node ${selected === i ? "selected" : ""}`}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(i);
                }
                const delta = 8;
                if (e.key.startsWith("Arrow")) {
                  e.preventDefault();
                  setPositions((p) =>
                    p.map((v, j) =>
                      j === i
                        ? {
                            x:
                              v.x +
                              (e.key === "ArrowRight"
                                ? delta
                                : e.key === "ArrowLeft"
                                  ? -delta
                                  : 0),
                            y:
                              v.y +
                              (e.key === "ArrowDown"
                                ? delta
                                : e.key === "ArrowUp"
                                  ? -delta
                                  : 0),
                          }
                        : v,
                    ),
                  );
                }
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = {
                  i,
                  x: e.clientX,
                  y: e.clientY,
                  px: positions[i].x,
                  py: positions[i].y,
                };
              }}
              onPointerMove={(e) => {
                if (drag.current?.i !== i) return;
                const d = drag.current;
                const factor =
                  940 /
                  scale /
                  e.currentTarget.ownerSVGElement!.getBoundingClientRect()
                    .width;
                setPositions((p) =>
                  p.map((v, j) =>
                    j === i
                      ? {
                          x: Math.max(
                            0,
                            Math.min(750, d.px + (e.clientX - d.x) * factor),
                          ),
                          y: Math.max(
                            28,
                            Math.min(520, d.py + (e.clientY - d.y) * factor),
                          ),
                        }
                      : v,
                  ),
                );
              }}
              onPointerUp={() => (drag.current = null)}
            >
              <rect width="190" height="70" rx="12" />
              <circle cx="19" cy="22" r="4" />
              <text x="19" y="49">
                {n.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="node-detail" aria-live="polite">
        <div>
          <span className="tiny">SELECTED COMPONENT</span>
          <h3>{nodes[selected].name}</h3>
        </div>
        <p>{nodes[selected].detail}</p>
        <button
          className="text-button"
          onClick={() => setSelected((v) => (v + 1) % nodes.length)}
        >
          Next component <ArrowRight />
        </button>
      </div>
      <p className="caption">
        Recreated from Figure 1, page 3. Drag a component or focus it and use
        arrow keys. Connections follow moved nodes. Playback illustrates the
        workflow; it does not run an LLM.
      </p>
    </div>
  );
}
function Metrics() {
  const [dataset, setDataset] = useState(0),
    [metric, setMetric] = useState(2),
    [showSd, setShowSd] = useState(true),
    [checkpoint, setCheckpoint] = useState("Agentic (Ours)");
  const rows = data.scores
    .filter((s) => !s.method.startsWith("Agentic@") || s.method === checkpoint)
    .filter(
      (s) => s.method !== "Agentic (Ours)" || checkpoint === "Agentic (Ours)",
    );
  return (
    <>
      <div className="chart-layout">
        <div className="chart-controls">
          <label>
            Dataset
            <select
              aria-label="Dataset"
              value={dataset}
              onChange={(e) => setDataset(+e.target.value)}
            >
              {datasets.map((d, i) => (
                <option value={i} key={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            Evaluation metric
            <select
              aria-label="Evaluation metric"
              value={metric}
              onChange={(e) => setMetric(+e.target.value)}
            >
              {metricNames.map((m, i) => (
                <option value={i} key={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Agent trial budget
            <select
              aria-label="Agent trial budget"
              value={checkpoint}
              onChange={(e) => setCheckpoint(e.target.value)}
            >
              <option value="Agentic@10">10 trials</option>
              <option value="Agentic@20">20 trials</option>
              <option value="Agentic (Ours)">30 trials</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={showSd}
              onChange={(e) => setShowSd(e.target.checked)}
            />{" "}
            Show ±1 SD
          </label>
          <p>
            300 held-out questions.
            <br />
            10 independent search seeds.
            <br />
            Identical test sets across methods.
          </p>
        </div>
        <div className="score-chart">
          <div className="chart-title">
            <h3>{datasets[dataset]}</h3>
            <span>{metricNames[metric]} / %</span>
          </div>
          <svg
            viewBox="0 0 730 340"
            role="img"
            aria-label={`${datasets[dataset]} ${metricNames[metric]} comparison, also available in Table 2`}
          >
            {[0, 20, 40, 60, 80, 100].map((t) => (
              <g key={t}>
                <line
                  x1={200 + t * 4.7}
                  y1="20"
                  x2={200 + t * 4.7}
                  y2="300"
                  className="gridline"
                />
                <text x={200 + t * 4.7} y="328" textAnchor="middle">
                  {t}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const [mean, sd] = r.datasets[dataset][metric];
              const x = 200 + mean * 470,
                y = 48 + i * 44;
              return (
                <g
                  key={r.method}
                  tabIndex={0}
                  aria-label={`${r.method}: ${fmt(mean)}, SD ${(sd * 100).toFixed(1)} percentage points`}
                >
                  <title>
                    {r.method}: {fmt(mean)} ± {(sd * 100).toFixed(1)} SD
                  </title>
                  <text x="8" y={y + 5}>
                    {r.method}
                  </text>
                  <line
                    x1="200"
                    x2={x}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="2"
                  />
                  {showSd && (
                    <line
                      x1={x - sd * 470}
                      x2={x + sd * 470}
                      y1={y}
                      y2={y}
                      stroke="var(--purple)"
                      strokeWidth="3"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={r.method.startsWith("Agentic") ? 7 : 5}
                    fill={
                      r.method === checkpoint ? "var(--purple)" : "var(--muted)"
                    }
                  />
                  <text x={x + 14} y={y - 10} className="value">
                    {fmt(mean)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <p className="caption">
        Table 2 / Source page 7. Points show means and whiskers show standard
        deviation, not confidence intervals. Validation search curves are shown
        separately in Figure 2.
      </p>
      <details>
        <summary>Inspect every exact mean and standard deviation</summary>
        <Table table={data.tables[1]} />
      </details>
    </>
  );
}
function Playground() {
  const [threshold, setThreshold] = useState(71.5);
  const points = [
    { name: "Agentic · matching accuracy", accuracy: 71.5, cost: 0.000288 },
    { name: "Agentic · higher ceiling", accuracy: 77, cost: 0.000741 },
    { name: "Warm MO-TPE · peak", accuracy: 71.5, cost: 0.001284 },
  ];
  const eligible = points.filter((p) => p.accuracy >= threshold);
  const best = [...eligible].sort((a, b) => a.cost - b.cost)[0];
  return (
    <div className="playground">
      <div>
        <span className="tiny">REPORTED OPERATING POINTS</span>
        <h3>Choose your accuracy bar.</h3>
        <p>
          Find the least expensive of three operating points explicitly reported
          for the median UniDoc curves.
        </p>
        <label className="range-label">
          Required exam accuracy <strong>{threshold.toFixed(1)}%</strong>
          <input
            type="range"
            min="60"
            max="82"
            step=".5"
            value={threshold}
            onChange={(e) => setThreshold(+e.target.value)}
          />
        </label>
        <div className="play-result" aria-live="polite">
          {best ? (
            <>
              <strong>${best.cost.toFixed(6)}</strong>
              <span>per query / {best.name}</span>
            </>
          ) : (
            <>
              <strong>No reported point</strong>
              <span>The three reported points do not meet this threshold.</span>
            </>
          )}
        </div>
        <p className="caption">
          This is a lookup over published points, not interpolation, a
          prediction, or a new optimizer run. The 77% ceiling is a median-curve
          result.
        </p>
      </div>
      <svg
        viewBox="0 0 530 350"
        aria-label="Reported UniDoc operating points with accuracy threshold"
        role="img"
      >
        {[60, 65, 70, 75, 80].map((v) => (
          <g key={v}>
            <line
              x1="65"
              x2="480"
              y1={300 - (v - 55) * 9}
              y2={300 - (v - 55) * 9}
              className="gridline"
            />
            <text x="16" y={305 - (v - 55) * 9}>
              {v}%
            </text>
          </g>
        ))}
        {[0.0003, 0.0006, 0.0009, 0.0012].map((v) => (
          <text x={65 + v * 300000} y="326" key={v} textAnchor="middle">
            ${v.toFixed(4)}
          </text>
        ))}
        <text x="270" y="349" textAnchor="middle">
          Mean API cost / query (USD, linear axis)
        </text>
        <line
          x1="65"
          x2="480"
          y1={300 - (threshold - 55) * 9}
          y2={300 - (threshold - 55) * 9}
          stroke="var(--magenta)"
          strokeDasharray="5 5"
        />
        {points.map((p, i) => (
          <g
            key={p.name}
            tabIndex={0}
            aria-label={`${p.name}: ${p.accuracy}% at $${p.cost}`}
          >
            <title>
              {p.name}: {p.accuracy}% at ${p.cost}
            </title>
            <circle
              cx={65 + p.cost * 300000}
              cy={300 - (p.accuracy - 55) * 9}
              r="9"
              fill={i === 2 ? "var(--muted)" : "var(--purple)"}
            />
            <text
              x={65 + p.cost * 300000}
              y={280 - (p.accuracy - 55) * 9}
              textAnchor="middle"
            >
              {p.accuracy}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
function App() {
  const [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [figure, setFigure] = useState<number | null>(null),
    [zoom, setZoom] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (figure !== null) {
      dialog.current?.showModal();
      setZoom(1);
    } else dialog.current?.close();
  }, [figure]);
  const nav = [
    "Overview",
    "Architecture",
    "Results",
    "Playground",
    "Methods",
    "Sources",
  ];
  return (
    <>
      <a className="skip" href="#overview">
        Skip to research
      </a>
      <header>
        <a href="#" className="wordmark">
          <span className="brand-icon">
            <GitBranch weight="bold" />
          </span>
          AutoRagline<span className="wordmark-sub">RESEARCH</span>
        </a>
        <nav aria-label="Main navigation" className={menu ? "open" : ""}>
          {nav.map((n) => (
            <a
              key={n}
              href={`#${n.toLowerCase()}`}
              onClick={() => setMenu(false)}
            >
              {n}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            aria-label={dark ? "Use light theme" : "Use dark theme"}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun /> : <Moon />}
          </button>
          <a
            className="source-link"
            href="https://github.com/space-rock-0/Agentic-AutoRAGline"
            target="_blank"
            rel="noreferrer"
          >
            Code <ArrowUpRight />
          </a>
          <button
            className="menu-button"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <List />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero" id="overview">
          <div className="hero-copy">
            <Reveal>
              <span className="eyebrow">
                A STUDY IN REASONING-DRIVEN OPTIMIZATION
              </span>
              <h1>
                Better retrieval.
                <br />
                <span>By reasoning.</span>
              </h1>
              <p>
                Explore how agents diagnose failures and discover more accurate,
                cost-efficient RAG pipelines.
              </p>
              <div className="hero-actions">
                <a className="button primary" href="#architecture">
                  Explore the system <ArrowRight />
                </a>
                <a className="button secondary" href="#results">
                  See the evidence <ArrowUpRight />
                </a>
              </div>
            </Reveal>
          </div>
          <Reveal className="hero-art">
            <div className="art-caption">
              <span>THE OPTIMIZATION SPACE</span>
              <span>Accuracy ↑ / Cost ↓</span>
            </div>
            <svg
              viewBox="0 0 530 410"
              role="img"
              aria-label="Conceptual accuracy-cost search space. Decorative positions are not measured results"
            >
              <defs>
                <pattern
                  id="dots"
                  width="25"
                  height="25"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="1" fill="var(--border)" />
                </pattern>
              </defs>
              <rect width="530" height="410" fill="url(#dots)" />
              {Array.from({ length: 22 }, (_, i) => (
                <path
                  key={i}
                  d={`M ${30 + i * 4} 350 C ${70 + i * 9} ${100 + i * 2}, ${270 + i * 4} ${310 - i * 10}, 490 ${50 + i * 8}`}
                  fill="none"
                  stroke="var(--purple)"
                  opacity={0.06 + i * 0.008}
                  strokeWidth="1.5"
                />
              ))}
              <path
                d="M55 338C100 260 160 248 220 172S350 145 470 77"
                fill="none"
                stroke="var(--purple)"
                strokeWidth="3"
              />
              {[
                [55, 338],
                [140, 254],
                [220, 172],
                [339, 131],
                [470, 77],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="9"
                    fill="var(--surface)"
                    stroke="var(--purple)"
                    strokeWidth="3"
                  />
                  <circle cx={x} cy={y} r="3" fill="var(--purple)" />
                </g>
              ))}
              <text x="310" y="75" fill="var(--purple)">
                reason → evaluate → improve
              </text>
              <text x="46" y="388">
                Conceptual search trajectory
              </text>
            </svg>
            <div className="art-footer">
              <GitBranch size={18} />
              <span>Every failure informs the next configuration.</span>
            </div>
          </Reveal>
        </section>
        <div className="finding-strip">
          <div>
            <strong>
              82.5<span>%</span>
            </strong>
            <span>HotpotQA held-out judge accuracy</span>
          </div>
          <div>
            <strong>
              77<span>%</span>
            </strong>
            <span>UniDoc median exam accuracy</span>
          </div>
          <div>
            <strong>
              22.4<span>%</span>
            </strong>
            <span>Baseline cost at matched accuracy</span>
          </div>
          <a href="#protocol">
            Understand the evaluation <ArrowUpRight />
          </a>
        </div>
        <section className="intro section">
          <Reveal>
            <h2>
              A score tells you what.
              <br />A diagnosis tells you why.
            </h2>
            <p className="lead">
              RAG configuration is an expensive search over interacting choices.
              A low score alone cannot tell an optimizer whether the evidence
              was missing or the answer failed despite having it.
            </p>
          </Reveal>
          <div className="contributions">
            <article>
              <span className="contribution-icon">
                <FlowArrow />
              </span>
              <h3>Diagnose, then propose</h3>
              <p>
                Per-question evidence separates retrieval failures from
                generation failures and informs the next configuration.
              </p>
            </article>
            <article>
              <span className="contribution-icon">
                <Database />
              </span>
              <h3>Search with prior knowledge</h3>
              <p>
                Public rankings and pricing help the agent choose capable models
                before spending a trial on them.
              </p>
            </article>
            <article>
              <span className="contribution-icon">
                <Check />
              </span>
              <h3>Keep the exam fixed</h3>
              <p>
                Grounded, discriminative questions provide one consistent target
                throughout the optimization run.
              </p>
            </article>
          </div>
          <details>
            <summary>Background: where this sits in RAG research</summary>
            <div className="prose">
              <p>
                AutoRAG uses greedy node-wise selection; AutoRAG-HP uses a
                bandit approach; syftr applies multi-objective Bayesian
                optimization; RAGSmith uses genetic search. These approaches
                motivate efficient search over expensive pipeline evaluations.
              </p>
              <p>
                OPRO and AgentHPO establish LLMs as optimizers. Here, an LLM
                proposes RAG configurations with evidence about failures. This
                differs from systems where an agent decides what to retrieve
                while answering a single user question.
              </p>
              <p>
                Corpus-derived evaluation builds on existing automated exam
                generation. This study adds open-ended questions with gold spans
                and probe-based discrimination for configuration search.
              </p>
            </div>
          </details>
        </section>
        <section className="section" id="architecture">
          <Reveal>
            <span className="eyebrow">INSIDE THE METHOD</span>
            <h2>Follow the reasoning.</h2>
            <p className="lead">
              Two connected workflows. One frozen evaluation target. A
              deliberate loop from evidence to the next experiment.
            </p>
          </Reveal>
          <Architecture />
          <div className="exam-method">
            <h3>Questions that distinguish pipelines</h3>
            <div className="method-columns">
              <p>
                <b>Neighborhoods.</b> An anchor chunk is paired with
                same-document siblings and TF-IDF-ranked cross-document chunks.
                The Composer drafts questions with exact supporting spans.
              </p>
              <p>
                <b>Validation.</b> Structure, phrasing, evidence and arithmetic
                are checked. A sufficiency oracle returns the smallest
                supporting subset to test multi-hop dependence.
              </p>
              <p>
                <b>Probe selection.</b> Four contrasting pipelines answer each
                candidate. Universally solved questions are dropped; a small
                share of unsolved questions is retained.
              </p>
            </div>
          </div>
          <div className="equations">
            <div>
              <h3>The two objectives</h3>
              <p className="equation">
                P<sub>c</sub>(q) → a
              </p>
              <p>
                A pipeline maps a question to an answer under configuration c ∈
                S.
              </p>
            </div>
            <div>
              <p className="equation">maximize f(c), minimize g(c)</p>
              <p>
                f(c) ∈ [0, 1] is answer accuracy; g(c) is mean API cost per
                query in USD.
              </p>
              <p className="equation small-eq">f(c*) ≥ f(c) ∧ g(c*) ≤ g(c)</p>
              <p>
                With at least one strict improvement, c* dominates c. The
                frontier contains the non-dominated evaluated configurations.
              </p>
            </div>
          </div>
        </section>
        <section className="section" id="results">
          <details>
            <summary>Read the optimization procedure</summary>
            <p>
              Explanatory pseudocode following Sections 3.2–3.3, rather than a
              quoted algorithm listing.
            </p>
            <pre>{`INPUT: corpus D, legal search space S, trial budget T
E ← supplied labeled questions OR compose → validate → probe-select(D)
Freeze E for all configurations
c ← Proposer(S, model knowledge, corpus description)
FOR trial = 1 ... T:
  index ← build_or_load_cached_index(D, c)
  answers, retrieved_spans ← run_pipeline(index, E, c)
  metrics, failure_evidence ← evaluate(answers, E, retrieved_spans)
  record(c, metrics); update accuracy-cost frontier
  IF trial < T:
    diagnosis ← Diagnoser(metrics, failure_evidence)
    c ← Proposer(diagnosis, history, knowledge, plan, S)
RETURN recommended configuration, frontier, reasoning trace`}</pre>
          </details>
          <Reveal>
            <h2>Evidence, in full.</h2>
            <p className="lead">
              Inspect exact results, switch metrics, and compare trial budgets.
              These are the study's reported measurements, not new runs of this
              website.
            </p>
          </Reveal>
          <Metrics />
          <div id="protocol" className="protocol">
            <h3>Two experiments, different claims.</h3>
            <div>
              <article>
                <b>Held-out benchmark accuracy</b>
                <p>
                  100 existing labeled validation questions guide search.
                  Returned configurations are evaluated on 300 separate
                  stratified test questions. 30 trials and 10 seeds per method.
                </p>
              </article>
              <article>
                <b>Healthcare accuracy and cost</b>
                <p>
                  230 PDFs and 20 images are parsed with Docling, OCR and table
                  extraction. A generated 100-question exam is reused across
                  methods and seeds. No separate held-out healthcare test is
                  reported.
                </p>
              </article>
            </div>
          </div>
          <Table table={data.tables[0]} />
          <div className="ablation">
            <h3>What does the ablation establish?</h3>
            <p>
              The no-KB/diagnosis agent removes both components together. Its
              judge accuracy is 81.9%, 29.8% and 78.0% across the three
              datasets, compared with 82.5%, 33.0% and 79.0% for the full agent.
              This does not isolate either component's individual contribution.
            </p>
            <p>
              On MultiHop-RAG the ablation matches full-agent EM and F1. MuSiQue
              remains difficult: its up-to-four-hop questions can require
              sequential retrieval beyond the searched single-round pipeline
              shape.
            </p>
          </div>
        </section>
        <section className="section" id="playground">
          <Reveal>
            <span className="eyebrow">EXPLORE THE TRADE-OFF</span>
            <h2>
              Accuracy has a price.
              <br />
              Find the operating point.
            </h2>
          </Reveal>
          <Playground />
          <div className="stat-note">
            <Info size={24} />
            <p>
              UniDoc peak accuracies across seeds range from 74% to 82%. The
              peak advantage uses two-sided Mann–Whitney U tests with Holm
              correction: p = 0.017 vs warm MO-TPE, 0.025 vs cold MO-TPE and
              0.001 vs random search. All 10 agent seeds reach 71.5%; counts are
              5/10, 4/10 and 2/10 for those baselines.
            </p>
          </div>
        </section>
        <section className="section" id="methods">
          <Reveal>
            <h2>
              Every choice is part
              <br />
              of the experiment.
            </h2>
            <p className="lead">
              The search tunes configurations, not model weights. Parsing stays
              fixed while chunking and downstream stages change.
            </p>
          </Reveal>
          <div className="search-space">
            {[
              ["Chunking", "2 strategies / 4 sizes / 4 overlaps"],
              ["Embeddings", "13 local retrieval models"],
              ["Retrieval", "Vector or hybrid BM25 + vector"],
              ["Expansion", "None, HyDE, multi-query, decomposition"],
              ["Reranking", "4 cross-encoders or none"],
              ["Generation", "35 LLMs / reasoning toggle"],
            ].map(([a, b]) => (
              <div key={a}>
                <span>{a}</span>
                <strong>{b}</strong>
              </div>
            ))}
          </div>
          <details>
            <summary>Experimental agents and configuration</summary>
            <p>
              The configuration in Appendix B uses kimi-k2.5 for diagnosis and
              proposal, minimax-m2.5 for composing questions, and DeepSeek-V3.2
              for judging. These are experimental choices, distinct from the
              current starter config.
            </p>
            <p>
              UniDoc uses 100 questions, a 1.8 over-generation setting,
              neighborhoods with at least 18 chunks / 5,000 words, and a 0.8 /
              0.2 same-document versus cross-document weighting. Retrieval top-k
              ranges from 3 to 20; reranking top-n from 3 to 10; temperature is
              fixed at 1.0.
            </p>
            {data.appendix
              .filter((a) => a.page === 13 || a.page === 14)
              .map((a) => (
                <details key={a.page}>
                  <summary>
                    {a.title} / page {a.page}
                  </summary>
                  <pre>{a.text}</pre>
                </details>
              ))}
          </details>
          <details>
            <summary>All search methods and comparison conditions</summary>
            <p>
              Random samples legal configurations. MO-TPE uses an Optuna
              multivariate TPE sampler; score-only in the accuracy experiment
              and multi-objective in the Pareto experiment. Warm MO-TPE receives
              30 prior random-search trials for free, in addition to its 30
              counted trials.
            </p>
            <p>
              The no-KB/diagnosis ablation sees score history and past
              configurations. KB Greedy selects top knowledge-base options
              without search. The MO-TPE comparison does not run full syftr: its
              agentic pipeline variants and Pareto pruning are excluded.
            </p>
          </details>
          <details>
            <summary>Question taxonomy and grounded examples</summary>
            <Table table={data.tables[2]} />
            <p>
              Extraction retrieves explicit facts; definitions explain concepts;
              single-span numeric questions compute within a passage; inference
              combines facts; bridge questions resolve an entity; comparison
              relates values; multi-span numeric questions compute across
              passages. Arithmetic formulas must evaluate to the canonical
              answer.
            </p>
            <p>
              98 of the 100 UniDoc questions stay within one document. Only two
              cross documents.
            </p>
            <details>
              <summary>Read the original grounded examples / page 12</summary>
              <pre>{data.appendix.find((a) => a.page === 12)?.text}</pre>
            </details>
          </details>
          <h3 className="subheading">Knowledge that guides the search</h3>
          <p>
            Artificial Analysis provides LLM rankings and throughput; MTEB,
            MMTEB and FollowIR provide retrieval signals; the study uses LiteLLM
            for per-token pricing. The snapshot is historical and incomplete.
          </p>
          {data.tables.slice(3).map((t) => (
            <details key={t.id}>
              <summary>
                {t.title} / {t.id.toUpperCase()}
              </summary>
              <Table table={t} />
            </details>
          ))}
          <div className="compute">
            <h3>Search-time compute is a separate cost.</h3>
            <p>
              The agent uses 11–16M embedding input tokens per dataset, compared
              with 46–79M for random and 34–63M for MO-TPE. Cached indexes
              reduce repeated embedding work.
            </p>
            <p>
              Diagnosis and proposal add $0.71–$0.79 per run. Full 30-trial
              score-only agent runs cost more than statistical baselines because
              they favor stronger generators. The 10-trial checkpoint costs
              $1.48–$2.92, versus $1.86–$4.45 for statistical baselines.
              Per-query API cost is not total infrastructure cost.
            </p>
          </div>
        </section>
        <section className="section" id="sources">
          <Reveal>
            <h2>Inspect the original evidence.</h2>
            <p className="lead">
              All four source figures, preserved rather than approximated. Open
              any figure to zoom and inspect its labels.
            </p>
          </Reveal>
          <div className="figure-grid">
            {data.figures.map((f, i) => (
              <figure key={f.id}>
                <button
                  className="figure-button"
                  onClick={() => setFigure(i)}
                  aria-label={`Open Figure ${f.id}: ${f.title}`}
                >
                  <img
                    src={`/research/${f.file}`}
                    alt={`Figure ${f.id}: ${f.title}`}
                    loading="lazy"
                  />
                  <span>
                    Figure {f.id}
                    <ArrowUpRight />
                  </span>
                </button>
                <figcaption>
                  <h3>{f.title}</h3>
                  <p>{f.caption}</p>
                  <small>Source page {f.page}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="limitations">
            <h2>Where the evidence ends.</h2>
            {[
              [
                "A fixed parser",
                "Docling parsing is cached and sits outside the search space. Parsing quality can bound downstream performance.",
              ],
              [
                "A historical knowledge base",
                "Rankings and prices change. Sparse reranker coverage gives the Proposer limited comparative evidence.",
              ],
              [
                "Nondeterminism and judge dependence",
                "Hosted reasoning outputs are not bit-exact. There is no human-agreement study for the LLM judge.",
              ],
              [
                "Limits of generalization",
                "Healthcare results use the generated tuning exam. Most questions stay within one document, and sequential multi-hop retrieval is not supported by the searched shape.",
              ],
            ].map(([a, b]) => (
              <details key={a}>
                <summary>{a}</summary>
                <p>{b}</p>
              </details>
            ))}
            <p>
              Future directions include richer cross-document bridges using
              entity relations, a wider pipeline search space, additional
              objectives such as latency and safety, and warm starts across
              runs.
            </p>
          </div>
          <details>
            <summary>Bibliographic sources</summary>
            <p>
              The following bibliography is extracted from source pages 9–10. It
              is presented as supporting research, without contact or
              affiliation profiles.
            </p>
            <div className="references">
              {data.references.map((r, i) => (
                <p key={i}>{r}</p>
              ))}
            </div>
          </details>
        </section>
        <section className="closing">
          <h2>
            Better configurations start
            <br />
            with better questions.
          </h2>
          <p>
            Ground the exam. Diagnose the failure. Reason about the next trial.
          </p>
          <a className="button primary" href="#architecture">
            Explore again <ArrowRight />
          </a>
        </section>
      </main>
      <footer>
        <a className="wordmark" href="#">
          AutoRagline
        </a>
        <p>Interactive research companion / source 2610.08452v1</p>
        <a href="https://github.com/space-rock-0/Agentic-AutoRAGline">
          Explore the code <ArrowUpRight />
        </a>
      </footer>
      <dialog
        ref={dialog}
        onCancel={() => setFigure(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setFigure(null);
        }}
      >
        <div className="dialog-head">
          <h3>{figure !== null ? data.figures[figure].title : ""}</h3>
          <div className="controls">
            <button
              aria-label="Zoom out figure"
              onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}
            >
              <Minus />
            </button>
            <button
              aria-label="Zoom in figure"
              onClick={() => setZoom((v) => Math.min(3, v + 0.25))}
            >
              <Plus />
            </button>
            <button aria-label="Close figure" onClick={() => setFigure(null)}>
              <X />
            </button>
          </div>
        </div>
        {figure !== null && (
          <>
            <div className="zoom-scroll">
              <img
                style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
                src={`/research/${data.figures[figure].file}`}
                alt={data.figures[figure].caption}
              />
            </div>
            <p>{data.figures[figure].caption}</p>
            <a href={`/research/${data.figures[figure].file}`} download>
              <Download /> Download source figure
            </a>
          </>
        )}
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
