import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const d = JSON.parse(
  fs.readFileSync(new URL("../src/research.json", import.meta.url)),
);
test("complete source tables and figures", () => {
  assert.equal(d.tables.length, 6);
  assert.equal(d.figures.length, 4);
  assert.equal(d.tables[3].rows.length, 12);
  assert.equal(d.tables[4].rows.length, 13);
  assert.equal(d.tables[5].rows.length, 4);
});
test("full held-out results preserve means and standard deviations", () => {
  assert.equal(d.scores.length, 8);
  const a = d.scores.find((s) => s.method === "Agentic (Ours)");
  assert.deepEqual(
    a.datasets.map((x) => x[2][0]),
    [0.825, 0.33, 0.79],
  );
  for (const s of d.scores)
    for (const ds of s.datasets)
      for (const [mean, sd] of ds) {
        assert.ok(mean >= 0 && mean <= 1);
        assert.ok(sd >= 0 && sd <= 1);
      }
});
test("question counts and missing values remain faithful", () => {
  assert.equal(
    d.tables[2].rows.slice(0, -1).reduce((n, r) => n + r[1], 0),
    100,
  );
  assert.equal(d.tables[5].rows[1][2], null);
  assert.equal(d.tables[5].rows[0][4], -0.01);
});
test("original source figures are available", () => {
  for (const f of d.figures)
    assert.ok(
      fs.statSync(new URL(`../public/research/${f.file}`, import.meta.url))
        .size > 1000,
    );
});
