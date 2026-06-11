import React, { useState } from 'react'
import { useStore, activeSprint } from './store.jsx'
import Dashboard from './components/Dashboard.jsx'
import Backlog from './components/Backlog.jsx'
import Board from './components/Board.jsx'
import Analytics from './components/Analytics.jsx'
import Retro from './components/Retro.jsx'
import Compliance from './components/Compliance.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'backlog', label: 'Backlog', icon: '☰' },
  { id: 'board', label: 'Sprint Board', icon: '▦' },
  { id: 'analytics', label: 'Burndown & Velocity', icon: '↘' },
  { id: 'retro', label: 'AI Retrospective', icon: '✦' },
  { id: 'compliance', label: 'Compliance', icon: '✓' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const { state, dispatch } = useStore()
  const sprint = activeSprint(state)

  const pages = {
    dashboard: <Dashboard go={setPage} />,
    backlog: <Backlog />,
    board: <Board />,
    analytics: <Analytics />,
    retro: <Retro />,
    compliance: <Compliance />,
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-edge bg-panel/50 flex flex-col">
        <div className="px-5 py-5 border-b border-edge">
          <div className="text-lg font-bold text-white tracking-tight">
            ⚡ Sprint<span className="text-indigo-400">Forge</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Agile + compliance, one board</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                page === item.id
                  ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:bg-edge hover:text-slate-200'
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-edge space-y-2">
          <div className="text-[11px] text-slate-500 px-2">
            Active: <span className="text-slate-300 font-medium">{sprint?.name}</span>
            <br />
            {sprint?.start} → {sprint?.end}
          </div>
          <button
            onClick={() => {
              if (confirm('Reset all demo data to its initial state?')) dispatch({ type: 'reset' })
            }}
            className="btn-ghost w-full justify-center text-xs"
          >
            ↺ Reset demo data
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-x-hidden">{pages[page]}</main>
    </div>
  )
}
