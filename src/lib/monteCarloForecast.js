/**
 * Probabilistic backlog forecasting for SprintForge.
 *
 * The existing forecast divides remaining points by a rolling average
 * velocity and reports one number. Real velocity varies, so this module
 * resamples the team's own completed-velocity history (bootstrap) to answer
 * "how many sprints with 50%, 85% and 95% confidence?" and turns that into
 * dates. Pure functions, seeded, no React imports.
 */

/** mulberry32: small seedable PRNG so forecasts are reproducible. */
export function createRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/**
 * @param {object} input
 * @param {number[]} input.velocities  completed points per past sprint, oldest first
 * @param {number} input.backlogPoints remaining points to deliver
 * @param {object} [options]
 * @param {number} [options.iterations=5000]
 * @param {number} [options.seed=20260101]
 * @param {number[]} [options.confidence=[0.5, 0.85, 0.95]]
 * @param {number} [options.recentSprints] only resample the last N sprints
 * @param {number} [options.maxSprints=200] safety cap per simulation
 * @returns {{ iterations, seed, sampleSize, sprintPercentiles: Record<string, number>, meanSprints, probabilityByDeadline: number[], histogram: {sprints, count}[], warnings: string[] }}
 */
export function forecastBacklogMonteCarlo({ velocities, backlogPoints }, options = {}) {
  const warnings = [];
  const history = (velocities ?? []).filter((v) => Number.isFinite(v) && v >= 0);
  const recent = options.recentSprints ? history.slice(-options.recentSprints) : history;
  const remaining = Number.isFinite(backlogPoints) ? Math.max(0, backlogPoints) : 0;
  const iterations = Math.max(100, Math.min(50000, Math.floor(options.iterations ?? 5000)));
  const seed = options.seed ?? 20260101;
  const confidence = options.confidence ?? [0.5, 0.85, 0.95];
  const maxSprints = Math.max(1, Math.floor(options.maxSprints ?? 200));

  if (recent.length < 3) warnings.push("Fewer than three sprints of history: the forecast is a rough guess.");
  if (recent.length > 0 && recent.every((v) => v === 0)) {
    warnings.push("Every past sprint completed zero points; the backlog cannot be forecast.");
  }

  const empty = () => ({
    iterations,
    seed,
    sampleSize: recent.length,
    sprintPercentiles: Object.fromEntries(confidence.map((c) => [`P${Math.round(c * 100)}`, 0])),
    meanSprints: 0,
    probabilityByDeadline: [],
    histogram: [],
    warnings,
  });
  if (remaining === 0) return empty();
  if (recent.length === 0 || recent.every((v) => v === 0)) {
    const result = empty();
    result.sprintPercentiles = Object.fromEntries(confidence.map((c) => [`P${Math.round(c * 100)}`, Infinity]));
    result.meanSprints = Infinity;
    return result;
  }

  const random = createRandom(seed);
  const outcomes = [];
  for (let i = 0; i < iterations; i += 1) {
    let delivered = 0;
    let sprints = 0;
    while (delivered < remaining && sprints < maxSprints) {
      delivered += recent[Math.floor(random() * recent.length)];
      sprints += 1;
    }
    outcomes.push(sprints);
  }
  const sorted = outcomes.sort((a, b) => a - b);
  const sprintPercentiles = Object.fromEntries(
    confidence.map((c) => [`P${Math.round(c * 100)}`, Math.ceil(percentile(sorted, c))]),
  );
  const max = sorted[sorted.length - 1];
  if (max >= maxSprints) warnings.push(`Some simulations hit the ${maxSprints}-sprint cap; percentiles near the top are truncated.`);

  const counts = new Map();
  for (const value of sorted) counts.set(value, (counts.get(value) ?? 0) + 1);
  const histogram = [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([sprints, count]) => ({ sprints, count }));
  const probabilityByDeadline = [];
  let cumulative = 0;
  for (let s = 1; s <= max; s += 1) {
    cumulative += counts.get(s) ?? 0;
    probabilityByDeadline.push(Math.round((cumulative / iterations) * 1000) / 1000);
  }

  return {
    iterations,
    seed,
    sampleSize: recent.length,
    sprintPercentiles,
    meanSprints: Math.round((sorted.reduce((sum, v) => sum + v, 0) / sorted.length) * 100) / 100,
    probabilityByDeadline,
    histogram,
    warnings,
  };
}

/** Probability (0-1) of finishing within `sprints` sprints, from a forecast result. */
export function probabilityWithinSprints(forecast, sprints) {
  if (!forecast || !Array.isArray(forecast.probabilityByDeadline)) return 0;
  if (sprints <= 0) return 0;
  const index = Math.min(sprints, forecast.probabilityByDeadline.length) - 1;
  return index < 0 ? 0 : forecast.probabilityByDeadline[index];
}

/**
 * Calendar date for a sprint count. `startDate` is the first day of the next
 * sprint; dates are computed in UTC to avoid DST drift.
 */
export function sprintsToDate(startDate, sprintLengthDays, sprints) {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) throw new Error("startDate must be a valid date.");
  if (!Number.isFinite(sprintLengthDays) || sprintLengthDays <= 0) throw new Error("sprintLengthDays must be positive.");
  if (!Number.isFinite(sprints)) return null;
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  end.setUTCDate(end.getUTCDate() + Math.ceil(sprints) * sprintLengthDays);
  return end.toISOString().slice(0, 10);
}

/** One-line summary for the forecast panel. */
export function describeForecast(forecast, { startDate, sprintLengthDays } = {}) {
  const p = forecast.sprintPercentiles;
  if (!Number.isFinite(p.P50)) return "Not enough completed work to forecast.";
  const parts = [`50% chance in ${p.P50} sprints`, `85% in ${p.P85 ?? "–"}`, `95% in ${p.P95 ?? "–"}`];
  let text = parts.join(", ") + `.`;
  if (startDate && sprintLengthDays) {
    text += ` At ${sprintLengthDays}-day sprints that is ${sprintsToDate(startDate, sprintLengthDays, p.P50)} (P50) to ${sprintsToDate(startDate, sprintLengthDays, p.P85)} (P85).`;
  }
  return text;
}
