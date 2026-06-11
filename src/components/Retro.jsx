import React, { useState } from 'react'
import { useStore, activeSprint } from '../store.jsx'
import { generateInsights } from '../lib/retroEngine.js'
import { PageHeader } from './ui.jsx'

const SAMPLE_NOTES = `Vault migration shipped early and the pairing sessions worked really well
Dispute intake form got great feedback from the pilot merchants
CI was flaky again this sprint, the e2e suite failed randomly and blocked two merges
We were blocked waiting on the infra team for the segmentation test environment
Two stories were added mid-sprint for the auditor request, that scope creep cost us
Standups ran long and we still missed the handoff between backend and frontend on evidence upload
Compliance evidence collection was manual again, screenshots took hours before the audit check-in
The new estimation baseline helped, sizing felt more accurate this sprint
Too much context switching for Dev between the vault work and on-call interruptions`

const MOOD = {
  positive: { label: 'Positive', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  mixed: { label: 'Mixed', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  strained: { label: 'Strained', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
}

const PRIORITY_CLS = {
  P0: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  P1: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  P2: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
}

export default function Retro() {
  const { state, dispatch } = useStore()
  const sprint = activeSprint(state)
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const analyze = () => {
    if (!notes.trim()) return
    setResult(generateInsights(notes, state.retros))
    setSaved(false)
  }

  const saveRetro = () => {
    dispatch({
      type: 'saveRetro',
      retro: {
        id: 'r' + Date.now().toString(36),
        sprintId: sprint.id,
        sprintName: sprint.name,
        date: new Date().toISOString().slice(0, 10),
        themes: result.detectedThemes,
        summary: `${result.stats.positive} positives, ${result.stats.negative} pain points, mood ${result.mood}.`,
      },
    })
    setSaved(true)
  }

  return (
    <div>
      <PageHeader
        title="AI Retrospective Generator"
        subtitle="Paste raw retro notes — the engine scores sentiment, clusters themes, flags issues recurring from past retros, and drafts prioritized action items"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">Retro notes — {sprint.name}</h3>
            <button onClick={() => setNotes(SAMPLE_NOTES)} className="text-xs text-indigo-400 hover:text-indigo-300">
              Load sample notes
            </button>
          </div>
          <textarea
            className="input min-h-[300px] font-mono text-[13px] leading-relaxed"
            placeholder={'One observation per line, e.g.\n- Shipped the vault migration early\n- CI was flaky and blocked merges\n- Scope was added mid-sprint again'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">
              {state.retros.length} past retro{state.retros.length === 1 ? '' : 's'} used for recurrence detection
            </span>
            <button onClick={analyze} className="btn-primary">✦ Generate insights</button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {!result && (
            <div className="card p-8 text-center text-slate-500 text-sm">
              Insights will appear here.
              <div className="text-xs mt-2 text-slate-600">
                Pipeline: sentiment scoring → theme clustering → recurrence detection → action items.
                Deterministic engine, designed to swap to the Claude API behind the same interface.
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="card p-4 flex flex-wrap items-center gap-3">
                <span className={`badge border ${MOOD[result.mood].cls}`}>Team mood: {MOOD[result.mood].label}</span>
                <span className="text-xs text-slate-400">
                  {result.stats.totalNotes} notes · {result.stats.positive} positive · {result.stats.negative} pain points
                </span>
                <button onClick={saveRetro} disabled={saved} className="btn-ghost ml-auto text-xs disabled:opacity-50">
                  {saved ? '✓ Saved to history' : 'Save retro to history'}
                </button>
              </div>

              <div className="card p-5">
                <h4 className="font-semibold text-emerald-300 mb-2">😊 What went well</h4>
                <ul className="space-y-1.5 text-sm text-slate-300">
                  {result.wentWell.map((w, i) => <li key={i}>• {w.line}</li>)}
                  {!result.wentWell.length && <li className="text-slate-500">No clear positives detected.</li>}
                </ul>
              </div>

              <div className="card p-5">
                <h4 className="font-semibold text-rose-300 mb-2">⚠ Needs improvement</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  {result.issues.map((issue) => (
                    <li key={issue.theme} className="bg-surface rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{issue.theme}</span>
                        {issue.recurring && (
                          <span className="badge bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            ↻ recurring ×{issue.recurrences + 1}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 ml-auto">{issue.count} mention{issue.count > 1 ? 's' : ''}</span>
                      </div>
                      {issue.examples[0] && <div className="text-xs text-slate-500 mt-1">“{issue.examples[0]}”</div>}
                    </li>
                  ))}
                  {!result.issues.length && <li className="text-slate-500">No issues detected.</li>}
                </ul>
              </div>

              <div className="card p-5">
                <h4 className="font-semibold text-indigo-300 mb-2">→ Suggested action items</h4>
                <ul className="space-y-2">
                  {result.actionItems.map((a, i) => (
                    <li key={i} className="bg-surface rounded-lg px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className={`badge border shrink-0 ${PRIORITY_CLS[a.priority]}`}>{a.priority}</span>
                        <div>
                          <div className="text-sm text-slate-200">{a.text}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Owner: {a.owner} · {a.rationale}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* History */}
          <div className="card p-5">
            <h4 className="font-semibold text-white mb-2 text-sm">Retro history</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {[...state.retros].reverse().map((r) => (
                <li key={r.id}>
                  <span className="text-slate-300 font-medium">{r.sprintName}</span> ({r.date}) — themes:{' '}
                  {r.themes.join(', ') || 'none'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
