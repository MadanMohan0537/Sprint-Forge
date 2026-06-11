import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts'
import { useStore, activeSprint, sprintStories, donePoints, backlogStories, totalPoints } from '../store.jsx'
import { burndownSeries, velocitySeries, rollingVelocity, backlogForecast } from '../lib/forecast.js'
import { PageHeader, Stat } from './ui.jsx'

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
}

export default function Analytics() {
  const { state } = useStore()
  const sprint = activeSprint(state)
  const stories = sprintStories(state, sprint.id)
  const liveRemaining = sprint.committed - donePoints(stories)
  const burndown = burndownSeries(sprint, state.burndown, liveRemaining)
  const velocity = velocitySeries(state.sprints)
  const rolling = rollingVelocity(state.sprints)
  const backlogPts = totalPoints(backlogStories(state))
  const forecast = backlogForecast(backlogPts, state.sprints)

  return (
    <div>
      <PageHeader title="Burndown & Velocity" subtitle="Live sprint burndown, historical velocity, and a rolling-average forecast" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Remaining this sprint" value={`${liveRemaining} pts`} sub={`of ${sprint.committed} committed`} tone="accent" />
        <Stat label="Rolling velocity" value={`${rolling.toFixed(1)} pts`} sub="last 3 sprints, mean" />
        <Stat label="Groomed backlog" value={`${backlogPts} pts`} sub="not yet committed" />
        <Stat label="Forecast to clear backlog" value={forecast.sprintsNeeded ? `${forecast.sprintsNeeded} sprints` : '—'} sub={`at ${rolling.toFixed(1)} pts / sprint`} tone="good" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-1">Sprint burndown — {sprint.name}</h3>
          <p className="text-xs text-slate-500 mb-4">Updates in real time as cards move to Done on the board. Gap above the ideal line = behind schedule.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={burndown} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#64748b" strokeDasharray="6 4" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3, fill: '#818cf8' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-white mb-1">Velocity by sprint</h3>
          <p className="text-xs text-slate-500 mb-4">Committed vs completed. The dashed line is the 3-sprint rolling average used for forecasting.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={velocity} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#33415533' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="committed" name="Committed" fill="#475569" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <ReferenceLine y={rolling} stroke="#34d399" strokeDasharray="6 4" label={{ value: `avg ${rolling.toFixed(1)}`, fill: '#34d399', fontSize: 11, position: 'insideTopRight' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-white mb-1">Backlog forecast</h3>
          <p className="text-xs text-slate-500 mb-4">
            Projected backlog burn at current rolling velocity — {backlogPts} pts clears in ~{forecast.sprintsNeeded ?? '—'} sprints.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forecast.series} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="sprint" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="remaining" name="Backlog remaining" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: '#34d399' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
