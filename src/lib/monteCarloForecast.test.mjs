import test from "node:test";
import assert from "node:assert/strict";
import { forecastBacklogMonteCarlo, probabilityWithinSprints, sprintsToDate, describeForecast } from "./monteCarloForecast.js";

const history = [21, 18, 25, 20, 16, 23];

test("forecast is deterministic for a seed and percentiles are ordered", () => {
  const a = forecastBacklogMonteCarlo({ velocities: history, backlogPoints: 120 }, { seed: 9, iterations: 3000 });
  const b = forecastBacklogMonteCarlo({ velocities: history, backlogPoints: 120 }, { seed: 9, iterations: 3000 });
  assert.deepEqual(a, b);
  assert.ok(a.sprintPercentiles.P50 <= a.sprintPercentiles.P85);
  assert.ok(a.sprintPercentiles.P85 <= a.sprintPercentiles.P95);
  // 120 points at 16-25 per sprint: between 5 and 8 sprints.
  assert.ok(a.sprintPercentiles.P50 >= 5 && a.sprintPercentiles.P95 <= 8);
  assert.equal(a.histogram.reduce((s, h) => s + h.count, 0), 3000);
  assert.equal(a.warnings.length, 0);
});

test("probabilityByDeadline is cumulative and probabilityWithinSprints reads it", () => {
  const f = forecastBacklogMonteCarlo({ velocities: history, backlogPoints: 60 }, { seed: 3 });
  for (let i = 1; i < f.probabilityByDeadline.length; i += 1) {
    assert.ok(f.probabilityByDeadline[i] >= f.probabilityByDeadline[i - 1]);
  }
  assert.equal(f.probabilityByDeadline[f.probabilityByDeadline.length - 1], 1);
  assert.equal(probabilityWithinSprints(f, 0), 0);
  assert.equal(probabilityWithinSprints(f, 100), 1);
  assert.equal(probabilityWithinSprints(f, 3), f.probabilityByDeadline[2]);
});

test("edge cases: empty backlog, no history, zero velocity, short history warning", () => {
  assert.equal(forecastBacklogMonteCarlo({ velocities: history, backlogPoints: 0 }).sprintPercentiles.P50, 0);
  const none = forecastBacklogMonteCarlo({ velocities: [], backlogPoints: 40 });
  assert.equal(none.sprintPercentiles.P50, Infinity);
  const zero = forecastBacklogMonteCarlo({ velocities: [0, 0, 0], backlogPoints: 40 });
  assert.equal(zero.meanSprints, Infinity);
  assert.ok(zero.warnings.some((w) => w.includes("zero points")));
  const short = forecastBacklogMonteCarlo({ velocities: [10, 12], backlogPoints: 30 });
  assert.ok(short.warnings.some((w) => w.includes("Fewer than three")));
});

test("recentSprints restricts the resampling window", () => {
  const all = forecastBacklogMonteCarlo({ velocities: [5, 5, 5, 30, 30, 30], backlogPoints: 90 }, { seed: 1 });
  const recent = forecastBacklogMonteCarlo({ velocities: [5, 5, 5, 30, 30, 30], backlogPoints: 90 }, { seed: 1, recentSprints: 3 });
  assert.equal(recent.sampleSize, 3);
  assert.equal(recent.sprintPercentiles.P95, 3);
  assert.ok(all.sprintPercentiles.P95 > recent.sprintPercentiles.P95);
});

test("sprintsToDate and describeForecast", () => {
  assert.equal(sprintsToDate("2026-10-05", 14, 3), "2026-11-16");
  assert.equal(sprintsToDate("2026-10-05", 14, Infinity), null);
  assert.throws(() => sprintsToDate("nope", 14, 1));
  const f = forecastBacklogMonteCarlo({ velocities: history, backlogPoints: 120 }, { seed: 9 });
  const text = describeForecast(f, { startDate: "2026-10-05", sprintLengthDays: 14 });
  assert.match(text, /50% chance in \d+ sprints, 85% in \d+, 95% in \d+\./);
  assert.match(text, /\(P50\) to \d{4}-\d\d-\d\d \(P85\)/);
  assert.equal(describeForecast(forecastBacklogMonteCarlo({ velocities: [], backlogPoints: 5 })), "Not enough completed work to forecast.");
});
