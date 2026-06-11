// Velocity + forecasting math. Kept pure so it is unit-testable and the
// methodology can be explained in interviews:
//
// - Velocity        = completed points per sprint
// - Rolling velocity = mean of the last 3 completed sprints (smooths noise)
// - Forecast        = remaining backlog points / rolling velocity, projected
//                     forward sprint by sprint (linear, like most PM tools)

export function completedSprints(sprints) {
  return sprints.filter((s) => !s.active && s.completed != null)
}

export function rollingVelocity(sprints, window = 3) {
  const done = completedSprints(sprints)
  const recent = done.slice(-window)
  if (!recent.length) return 0
  return recent.reduce((sum, s) => sum + s.completed, 0) / recent.length
}

export function velocitySeries(sprints) {
  return completedSprints(sprints).map((s) => ({
    name: s.name,
    committed: s.committed,
    completed: s.completed,
  }))
}

// Projected burndown of the remaining backlog, sprint by sprint.
export function backlogForecast(backlogPoints, sprints) {
  const v = rollingVelocity(sprints)
  if (v <= 0) return { sprintsNeeded: null, series: [] }
  const series = [{ sprint: 'Now', remaining: backlogPoints }]
  let remaining = backlogPoints
  let i = 1
  const lastNum = parseInt(sprints[sprints.length - 1].name.replace(/\D/g, ''), 10) || 0
  while (remaining > 0 && i <= 12) {
    remaining = Math.max(0, remaining - v)
    series.push({ sprint: `S${lastNum + i}`, remaining: Math.round(remaining * 10) / 10 })
    i++
  }
  return { sprintsNeeded: Math.ceil(backlogPoints / v), series }
}

// Ideal burndown line for the active sprint (straight line committed -> 0).
export function idealBurndown(sprint) {
  const start = new Date(sprint.start)
  const end = new Date(sprint.end)
  const days = Math.round((end - start) / 86400000)
  const out = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86400000)
    out.push({
      date: d.toISOString().slice(0, 10),
      ideal: Math.round((sprint.committed * (1 - i / days)) * 10) / 10,
    })
  }
  return out
}

// Merge ideal line with actual snapshots + a live "today" point.
export function burndownSeries(sprint, snapshots, liveRemaining) {
  const ideal = idealBurndown(sprint)
  const actualByDate = Object.fromEntries(snapshots.map((s) => [s.date, s.remaining]))
  const todayKey = new Date().toISOString().slice(0, 10)
  return ideal.map((row) => {
    let actual = actualByDate[row.date]
    if (row.date === todayKey) actual = liveRemaining
    return { ...row, actual: row.date <= todayKey ? actual : undefined }
  })
}
