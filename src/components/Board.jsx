import React, { useState } from 'react'
import { useStore, activeSprint, sprintStories, donePoints } from '../store.jsx'
import { PageHeader, PointsBadge, ComplianceBadge, EpicBadge, Avatar } from './ui.jsx'
import StoryModal from './StoryModal.jsx'
import { STATUS_LABELS } from '../data/seed.js'

const COLUMNS = ['todo', 'inprogress', 'review', 'done']

export default function Board() {
  const { state, dispatch } = useStore()
  const sprint = activeSprint(state)
  const stories = sprintStories(state, sprint.id)
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const [editing, setEditing] = useState(null)

  const drop = (status) => {
    if (dragId) {
      const story = stories.find((s) => s.id === dragId)
      if (story && story.status !== status) {
        dispatch({ type: 'updateStory', id: dragId, patch: { status } })
      }
    }
    setDragId(null)
    setOverCol(null)
  }

  const done = donePoints(stories)

  return (
    <div>
      <PageHeader
        title="Sprint Board"
        subtitle={`${sprint.name} · drag cards between columns — every move is burned down live and written to the audit trail`}
      >
        <span className="badge bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          {done} / {sprint.committed} pts done
        </span>
      </PageHeader>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const cards = stories.filter((s) => s.status === col)
          const pts = cards.reduce((sum, s) => sum + s.points, 0)
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col) }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={() => drop(col)}
              className={`rounded-xl border p-3 min-h-[400px] transition-colors ${
                overCol === col ? 'border-indigo-500 bg-indigo-500/5' : 'border-edge bg-panel/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-slate-300">{STATUS_LABELS[col]}</span>
                <span className="text-xs text-slate-500">{cards.length} · {pts} pts</span>
              </div>
              <div className="space-y-2">
                {cards.map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null) }}
                    onDoubleClick={() => setEditing(s)}
                    className={`card p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/60 ${
                      dragId === s.id ? 'opacity-40' : ''
                    }`}
                    title="Drag to move · double-click to edit"
                  >
                    <div className="text-sm text-slate-200 font-medium mb-2">{s.title}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <EpicBadge epic={s.epic} />
                      <ComplianceBadge framework={s.compliance} />
                      <span className="ml-auto flex items-center gap-1.5">
                        <PointsBadge points={s.points} />
                        <Avatar name={s.assignee} />
                      </span>
                    </div>
                  </div>
                ))}
                {!cards.length && (
                  <div className="text-xs text-slate-600 text-center py-6 border border-dashed border-edge rounded-lg">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <StoryModal
          story={editing}
          onSave={(form) => dispatch({ type: 'updateStory', id: editing.id, patch: form })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
