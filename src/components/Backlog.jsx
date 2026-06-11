import React, { useMemo, useState } from 'react'
import { useStore, backlogStories, totalPoints } from '../store.jsx'
import { PageHeader, PointsBadge, ComplianceBadge, EpicBadge } from './ui.jsx'
import StoryModal from './StoryModal.jsx'

// WSJF-lite score used for ranking: value density = value / effort.
const score = (s) => s.value / s.effort

const QUADRANTS = [
  { key: 'quickwin', label: 'Quick Wins', hint: 'high value · low effort — do first', color: 'text-emerald-300', test: (s) => s.value >= 3 && s.effort < 3 },
  { key: 'bigbet', label: 'Big Bets', hint: 'high value · high effort — plan deliberately', color: 'text-indigo-300', test: (s) => s.value >= 3 && s.effort >= 3 },
  { key: 'fillin', label: 'Fill-ins', hint: 'low value · low effort — slack capacity only', color: 'text-amber-300', test: (s) => s.value < 3 && s.effort < 3 },
  { key: 'moneypit', label: 'Money Pits', hint: 'low value · high effort — challenge or drop', color: 'text-rose-300', test: (s) => s.value < 3 && s.effort >= 3 },
]

export default function Backlog() {
  const { state, dispatch } = useStore()
  const [view, setView] = useState('list') // list | matrix
  const [editing, setEditing] = useState(null) // story object or 'new'

  const backlog = useMemo(
    () => [...backlogStories(state)].sort((a, b) => score(b) - score(a)),
    [state],
  )

  const save = (form) => {
    if (editing === 'new') dispatch({ type: 'addStory', story: form })
    else dispatch({ type: 'updateStory', id: editing.id, patch: form })
  }

  return (
    <div>
      <PageHeader title="Backlog Grooming" subtitle={`${backlog.length} stories · ${totalPoints(backlog)} points groomed, ranked by value density (value ÷ effort)`}>
        <div className="flex rounded-lg border border-edge overflow-hidden">
          {['list', 'matrix'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium ${view === v ? 'bg-indigo-600 text-white' : 'bg-panel text-slate-400 hover:text-slate-200'}`}
            >
              {v === 'list' ? '☰ List' : '◫ Matrix'}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary">+ New story</button>
      </PageHeader>

      {view === 'list' ? (
        <ListView backlog={backlog} onEdit={setEditing} dispatch={dispatch} />
      ) : (
        <MatrixView backlog={backlog} onEdit={setEditing} />
      )}

      {editing && (
        <StoryModal
          story={editing === 'new' ? null : editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ListView({ backlog, onEdit, dispatch }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-edge">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Story</th>
            <th className="px-4 py-3">Epic</th>
            <th className="px-4 py-3 text-center">Value</th>
            <th className="px-4 py-3 text-center">Effort</th>
            <th className="px-4 py-3 text-center">Points</th>
            <th className="px-4 py-3 text-center">Compliance</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {backlog.map((s, i) => (
            <tr key={s.id} className="border-b border-edge/50 hover:bg-surface/60">
              <td className="px-4 py-3 text-slate-500">{i + 1}</td>
              <td className="px-4 py-3">
                <button onClick={() => onEdit(s)} className="text-slate-200 hover:text-indigo-300 text-left font-medium">
                  {s.title}
                </button>
              </td>
              <td className="px-4 py-3"><EpicBadge epic={s.epic} /></td>
              <td className="px-4 py-3 text-center text-slate-300">{s.value}</td>
              <td className="px-4 py-3 text-center text-slate-300">{s.effort}</td>
              <td className="px-4 py-3 text-center"><PointsBadge points={s.points} /></td>
              <td className="px-4 py-3 text-center"><ComplianceBadge framework={s.compliance} /></td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button onClick={() => dispatch({ type: 'commitToSprint', id: s.id })} className="text-xs text-emerald-400 hover:text-emerald-300 mr-3" title="Commit to active sprint">
                  → Sprint
                </button>
                <button onClick={() => dispatch({ type: 'deleteStory', id: s.id })} className="text-xs text-rose-400/70 hover:text-rose-300">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!backlog.length && (
            <tr><td colSpan="8" className="px-4 py-8 text-center text-slate-500">Backlog is empty — add a story.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function MatrixView({ backlog, onEdit }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {QUADRANTS.map((q) => {
          const items = backlog.filter(q.test)
          return (
            <div key={q.key} className="card p-4 min-h-[180px]">
              <div className={`font-semibold ${q.color}`}>{q.label}</div>
              <div className="text-[11px] text-slate-500 mb-3">{q.hint}</div>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onEdit(s)}
                    title={`${s.title} — value ${s.value}, effort ${s.effort}`}
                    className="bg-surface border border-edge hover:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 text-left max-w-[220px]"
                  >
                    <span className="block truncate">{s.title}</span>
                    <span className="text-slate-500">{s.points} pts</span>
                  </button>
                ))}
                {!items.length && <span className="text-xs text-slate-600">—</span>}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Axes: business value (1–5) vs estimated effort (1–5), set during grooming. Click a story to re-score it.
      </p>
    </div>
  )
}
