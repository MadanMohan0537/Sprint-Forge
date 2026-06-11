import React from 'react'
import { useStore, activeSprint, sprintStories, backlogStories, donePoints, totalPoints } from '../store.jsx'
import { rollingVelocity } from '../lib/forecast.js'
import { PageHeader, Stat, PointsBadge, ComplianceBadge, Avatar } from './ui.jsx'
import { STATUS_LABELS } from '../data/seed.js'

export default function Dashboard({ go }) {
  const { state } = useStore()
  const sprint = activeSprint(state)
  const stories = sprintStories(state, sprint.id)
  const done = donePoints(stories)
  const committed = sprint.committed
  const pct = Math.round((done / committed) * 100)

  const today = new Date()
  const end = new Date(sprint.end)
  const start = new Date(sprint.start)
  const daysLeft = Math.max(0, Math.ceil((end - today) / 86400000))
  const elapsedPct = Math.min(100, Math.round(((today - start) / (end - start)) * 100))
  const onTrack = pct >= elapsedPct - 10

  const velocity = rollingVelocity(state.sprints)
  const backlog = backlogStories(state)
  const inFlight = stories.filter((s) => ['inprogress', 'review'].includes(s.status))
  const atRisk = stories.filter((s) => s.status === 'todo' && s.points >= 5)
  const complianceOpen = stories.filter((s) => s.compliance && s.status !== 'done')

  return (
    <div>
      <PageHeader
        title={`${sprint.name} — ${sprint.goal}`}
        subtitle={`${sprint.start} → ${sprint.end} · ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`}
      >
        <span className={`badge border ${onTrack ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
          {onTrack ? '● On track' : '▲ At risk'}
        </span>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Sprint progress" value={`${done} / ${committed} pts`} sub={`${pct}% complete · ${elapsedPct}% of time elapsed`} tone={onTrack ? 'good' : 'warn'} />
        <Stat label="Rolling velocity" value={`${velocity.toFixed(1)} pts`} sub="avg of last 3 sprints" tone="accent" />
        <Stat label="Backlog depth" value={`${totalPoints(backlog)} pts`} sub={`${backlog.length} groomed stories`} />
        <Stat label="Open compliance items" value={complianceOpen.length} sub="in active sprint" tone={complianceOpen.length ? 'warn' : 'good'} />
      </div>

      {/* progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Story points burned</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">In flight ({inFlight.length})</h3>
            <button onClick={() => go('board')} className="text-xs text-indigo-400 hover:text-indigo-300">Open board →</button>
          </div>
          <ul className="space-y-2">
            {inFlight.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 bg-surface rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm text-slate-200 truncate">{s.title}</div>
                  <div className="text-[11px] text-slate-500">{STATUS_LABELS[s.status]}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ComplianceBadge framework={s.compliance} />
                  <PointsBadge points={s.points} />
                  <Avatar name={s.assignee} />
                </div>
              </li>
            ))}
            {!inFlight.length && <li className="text-sm text-slate-500">Nothing in progress.</li>}
          </ul>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Risk radar</h3>
            <button onClick={() => go('analytics')} className="text-xs text-indigo-400 hover:text-indigo-300">Burndown →</button>
          </div>
          <ul className="space-y-2 text-sm">
            {!onTrack && (
              <li className="flex gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                ▲ Burn rate behind ideal — {pct}% done vs {elapsedPct}% time elapsed.
              </li>
            )}
            {atRisk.map((s) => (
              <li key={s.id} className="flex gap-2 text-slate-300 bg-surface rounded-lg px-3 py-2">
                ⏳ <span className="truncate">{s.title}</span>
                <span className="text-slate-500 shrink-0 ml-auto">{s.points} pts not started</span>
              </li>
            ))}
            {complianceOpen.map((s) => (
              <li key={s.id} className="flex gap-2 text-slate-300 bg-surface rounded-lg px-3 py-2">
                🛡 <span className="truncate">{s.title}</span>
                <span className="text-slate-500 shrink-0 ml-auto">{s.compliance} open</span>
              </li>
            ))}
            {onTrack && !atRisk.length && !complianceOpen.length && (
              <li className="text-emerald-300">All clear — sprint is healthy.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
