// ---------------------------------------------------------------------------
// AI Retrospective Engine
// ---------------------------------------------------------------------------
// A deterministic NLP pipeline that turns raw retro notes into structured
// insights: sentiment scoring -> theme classification -> clustering ->
// recurrence detection -> action-item generation.
//
// DESIGNED TO BE AI-SWAPPABLE: `generateInsights(notes, pastRetros)` is the
// single entry point. To upgrade to a real LLM, replace the body of this
// function with a call to the Claude API (see `claudePromptFor()` below,
// which builds a ready-to-use prompt) and keep the same return shape.
// ---------------------------------------------------------------------------

const POSITIVE = ['great', 'good', 'well', 'love', 'loved', 'smooth', 'happy', 'win', 'shipped', 'finished', 'early', 'clear', 'helped', 'helpful', 'improved', 'better', 'awesome', 'fast', 'proud', 'success', 'unblocked', 'easy']
const NEGATIVE = ['bad', 'slow', 'blocked', 'blocker', 'late', 'delay', 'delayed', 'confusing', 'confused', 'unclear', 'missed', 'failed', 'failure', 'frustrating', 'frustrated', 'stress', 'stressful', 'overload', 'overloaded', 'churn', 'rework', 'broke', 'broken', 'bug', 'bugs', 'stuck', 'waiting', 'creep', 'thrash', 'burnout', 'painful', 'hard', 'difficult', 'noisy', 'flaky']

const THEMES = {
  'scope creep': ['scope', 'creep', 'added mid-sprint', 'mid-sprint', 'last minute', 'last-minute', 'unplanned', 'changed requirements', 'requirement change'],
  communication: ['communication', 'communicate', 'standup', 'stand-up', 'sync', 'updates', 'silo', 'siloed', 'alignment', 'aligned', 'handoff', 'hand-off'],
  dependencies: ['dependency', 'dependencies', 'blocked by', 'waiting on', 'waiting for', 'infra team', 'other team', 'external', 'vendor', 'api team'],
  testing: ['test', 'tests', 'testing', 'qa', 'flaky', 'coverage', 'regression', 'ci', 'pipeline', 'e2e'],
  estimation: ['estimate', 'estimates', 'estimation', 'points', 'underestimated', 'overestimated', 'sizing', 'sized', 'bigger than expected'],
  tooling: ['tool', 'tooling', 'environment', 'env', 'deploy', 'deployment', 'build', 'setup', 'local dev', 'staging'],
  process: ['process', 'ceremony', 'ceremonies', 'meeting', 'meetings', 'planning', 'refinement', 'grooming', 'wip', 'review process'],
  compliance: ['compliance', 'audit', 'auditor', 'sox', 'kyc', 'aml', 'pci', 'gdpr', 'evidence', 'control', 'regulator', 'regulatory'],
  workload: ['workload', 'overloaded', 'too much', 'capacity', 'burnout', 'context switching', 'context-switching', 'interrupted', 'interruptions', 'on-call', 'oncall'],
}

const ACTION_TEMPLATES = {
  'scope creep': { text: 'Adopt a mid-sprint change policy: new requests go to backlog unless swapped for equal points with PM sign-off.', owner: 'Product Manager' },
  communication: { text: 'Add a 15-min async written check-in (thread or doc) on non-standup days; review handoffs in refinement.', owner: 'Scrum Master' },
  dependencies: { text: 'Map cross-team dependencies during planning and pre-book the dependent team’s capacity before sprint start.', owner: 'Tech Lead' },
  testing: { text: 'Quarantine flaky tests within 24h and add a CI health check to the Definition of Done.', owner: 'QA Lead' },
  estimation: { text: 'Re-baseline reference stories and split anything estimated above 8 points before it enters a sprint.', owner: 'Team' },
  tooling: { text: 'Timebox a spike to fix the top environment/deploy pain point next sprint (capped at 3 points).', owner: 'Tech Lead' },
  process: { text: 'Audit recurring meetings: cancel one, convert one to async, and set a WIP limit of 2 per person.', owner: 'Scrum Master' },
  compliance: { text: 'Attach control references to compliance stories at grooming time and auto-generate evidence from the audit trail.', owner: 'Compliance Officer' },
  workload: { text: 'Track interrupt work as pointed stories and reserve 15% sprint capacity for unplanned work.', owner: 'Product Manager' },
}

function sentimentScore(line) {
  const words = line.toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/)
  let score = 0
  for (const w of words) {
    if (POSITIVE.includes(w)) score++
    if (NEGATIVE.includes(w)) score--
  }
  // phrase-level negatives that word matching misses
  const l = line.toLowerCase()
  if (/(didn't|did not|couldn't|could not|wasn't|was not|never)\s+(finish|ship|work|test|align)/.test(l)) score -= 2
  if (/went well|worked well/.test(l)) score += 2
  return score
}

function classifyThemes(line) {
  const l = line.toLowerCase()
  const hits = []
  for (const [theme, keywords] of Object.entries(THEMES)) {
    if (keywords.some((k) => l.includes(k))) hits.push(theme)
  }
  return hits
}

export function generateInsights(rawNotes, pastRetros = []) {
  const lines = rawNotes
    .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((l) => l.length > 3)

  const analyzed = lines.map((line) => ({
    line,
    sentiment: sentimentScore(line),
    themes: classifyThemes(line),
  }))

  const wentWell = analyzed.filter((a) => a.sentiment > 0)
  const needsWork = analyzed.filter((a) => a.sentiment < 0)
  const neutral = analyzed.filter((a) => a.sentiment === 0)

  // Cluster negative + neutral lines by theme, count frequency
  const themeCounts = {}
  for (const a of [...needsWork, ...neutral]) {
    for (const t of a.themes) {
      themeCounts[t] = themeCounts[t] || { count: 0, examples: [] }
      themeCounts[t].count++
      if (themeCounts[t].examples.length < 2) themeCounts[t].examples.push(a.line)
    }
  }

  const pastThemes = pastRetros.flatMap((r) => r.themes || [])

  const issues = Object.entries(themeCounts)
    .map(([theme, data]) => {
      const recurrences = pastThemes.filter((t) => t === theme).length
      return {
        theme,
        count: data.count,
        examples: data.examples,
        recurring: recurrences > 0,
        recurrences,
        // recurring issues outrank one-off ones; then by frequency
        weight: data.count + recurrences * 2,
      }
    })
    .sort((a, b) => b.weight - a.weight)

  const actionItems = issues.slice(0, 4).map((issue, i) => ({
    priority: issue.recurring ? 'P0' : i === 0 ? 'P1' : 'P2',
    theme: issue.theme,
    text: ACTION_TEMPLATES[issue.theme]?.text || `Run a root-cause session on "${issue.theme}" and agree one experiment for next sprint.`,
    owner: ACTION_TEMPLATES[issue.theme]?.owner || 'Team',
    rationale: issue.recurring
      ? `Recurring theme — also raised in ${issue.recurrences} previous retro${issue.recurrences > 1 ? 's' : ''}.`
      : `Mentioned ${issue.count} time${issue.count > 1 ? 's' : ''} this retro.`,
  }))

  const overallSentiment = analyzed.reduce((s, a) => s + a.sentiment, 0)
  const mood = overallSentiment > 2 ? 'positive' : overallSentiment < -2 ? 'strained' : 'mixed'

  return {
    mood,
    stats: {
      totalNotes: analyzed.length,
      positive: wentWell.length,
      negative: needsWork.length,
      neutral: neutral.length,
    },
    wentWell: wentWell.map((a) => ({ line: a.line, themes: a.themes })),
    needsWork: needsWork.map((a) => ({ line: a.line, themes: a.themes })),
    issues,
    actionItems,
    detectedThemes: issues.map((i) => i.theme),
  }
}

// ---------------------------------------------------------------------------
// LLM upgrade path: build the prompt you would send to the Claude API.
// Swap generateInsights() internals for:
//
//   const res = await fetch('/api/retro', { method: 'POST',
//     body: JSON.stringify({ prompt: claudePromptFor(rawNotes, pastRetros) }) })
//
// with a serverless function holding the API key. Return shape stays the same.
// ---------------------------------------------------------------------------
export function claudePromptFor(rawNotes, pastRetros = []) {
  return [
    'You are an experienced agile coach. Analyze these sprint retrospective notes.',
    'Past retro themes: ' + (pastRetros.flatMap((r) => r.themes).join(', ') || 'none'),
    'Return JSON with keys: mood, wentWell[], needsWork[], issues[{theme,count,recurring}], actionItems[{priority,text,owner,rationale}].',
    'Flag any theme that also appeared in past retros as recurring and raise its priority.',
    '',
    'NOTES:',
    rawNotes,
  ].join('\n')
}
