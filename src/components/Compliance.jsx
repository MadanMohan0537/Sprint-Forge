import React, { useMemo, useState } from 'react'
import { useStore, activeSprint, sprintStories } from '../store.jsx'
import { PageHeader, Stat, ComplianceBadge, PointsBadge } from './ui.jsx'
import { STATUS_LABELS, COMPLIANCE_FRAMEWORKS } from '../data/seed.js'

export default function Compliance() {
  const { state } = useStore()
  const sprint = activeSprint(state)
  const [filter, setFilter] = useState('all')

  const complianceStories = state.stories.filter((s) => s.compliance)
  const inSprint = sprintStories(state, sprint.id).filter((s) => s.compliance)
  const doneInSprint = inSprint.filter((s) => s.status === 'done')
  const readiness = inSprint.length ? Math.round((doneInSprint.length / inSprint.length) * 100) : 100

  const log = useMemo(() => {
    const entries = [...state.auditLog].sort((a, b) => (a.ts < b.ts ? 1 : -1))
    if (filter === 'all') return entries
    if (filter === 'compliance') return entries.filter((e) => e.compliance)
    return entries.filter((e) => e.compliance === filter)
  }, [state.auditLog, filter])

  const exportCsv = () => {
    const header = 'timestamp,user,story,action,from,to,compliance_framework\n'
    const rows = log
      .map((e) =>
        [e.ts, e.user, `"${(e.storyTitle || '').replace(/"/g, '""')}"`, e.action, e.from ?? '', e.to ?? '', e.compliance ?? ''].join(','),
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sprintforge-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title="Compliance Sprint Tracker"
        subtitle="Regulatory work tracked alongside delivery — with an immutable audit trail auditors can consume directly"
      >
        <button onClick={exportCsv} className="btn-primary">⤓ Export audit trail (CSV)</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Audit readiness (sprint)" value={`${readiness}%`} sub={`${doneInSprint.length} of ${inSprint.length} compliance stories done`} tone={readiness >= 70 ? 'good' : 'warn'} />
        <Stat label="Compliance stories (all)" value={complianceStories.length} sub="across backlog + sprint" />
        <Stat label="Audit log entries" value={state.auditLog.length} sub="immutable, append-only" tone="accent" />
        <Stat label="Frameworks in play" value={new Set(complianceStories.map((s) => s.compliance)).size} sub="SOX · KYC/AML · PCI-DSS · GDPR" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compliance stories */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-3">Compliance-flagged stories</h3>
          <ul className="space-y-2">
            {complianceStories.map((s) => (
              <li key={s.id} className="bg-surface rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 font-medium truncate">{s.title}</span>
                  <span className="ml-auto shrink-0"><PointsBadge points={s.points} /></span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <ComplianceBadge framework={s.compliance} />
                  <span className={`badge ${s.status === 'done' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-edge text-slate-400'}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>
                {s.complianceNote && (
                  <div className="text-[11px] text-slate-500 mt-1.5">Control: {s.complianceNote}</div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Audit trail */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-semibold text-white mr-auto">Audit trail</h3>
            {['all', 'compliance', ...COMPLIANCE_FRAMEWORKS].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  filter === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-surface border-edge text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'compliance' ? 'Compliance only' : f}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto max-h-[480px] -mx-2 px-2">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-panel">
                <tr className="text-left uppercase tracking-wider text-slate-500 border-b border-edge">
                  <th className="py-2 pr-3">Timestamp</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Story</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Transition</th>
                  <th className="py-2">Framework</th>
                </tr>
              </thead>
              <tbody>
                {log.map((e) => (
                  <tr key={e.id} className="border-b border-edge/40 text-slate-300">
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{e.ts.replace('T', ' ').slice(0, 16)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{e.user}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={e.storyTitle}>{e.storyTitle}</td>
                    <td className="py-2 pr-3">{e.action}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-400">
                      {e.from && e.to ? `${e.from} → ${e.to}` : e.to || e.from || '—'}
                    </td>
                    <td className="py-2"><ComplianceBadge framework={e.compliance} /></td>
                  </tr>
                ))}
                {!log.length && (
                  <tr><td colSpan="6" className="py-6 text-center text-slate-500">No entries for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-600 mt-3">
            Entries are append-only: edits, status changes, sprint commitments, and descopes are recorded with
            user attribution and timestamps — the evidence model SOX/PCI auditors expect.
          </p>
        </div>
      </div>
    </div>
  )
}
