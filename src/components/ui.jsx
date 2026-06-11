import React from 'react'

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-white',
    good: 'text-emerald-400',
    warn: 'text-amber-400',
    bad: 'text-rose-400',
    accent: 'text-indigo-400',
  }
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export function PointsBadge({ points }) {
  return (
    <span className="badge bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
      {points} pts
    </span>
  )
}

const FRAMEWORK_COLORS = {
  SOX: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'KYC/AML': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'PCI-DSS': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  GDPR: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

export function ComplianceBadge({ framework }) {
  if (!framework) return null
  return (
    <span className={`badge border ${FRAMEWORK_COLORS[framework] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'}`}>
      🛡 {framework}
    </span>
  )
}

export function EpicBadge({ epic }) {
  return <span className="badge bg-edge text-slate-300">{epic}</span>
}

export function Avatar({ name }) {
  if (!name) return null
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2)
  return (
    <span
      title={name}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-indigo-200 text-[10px] font-bold"
    >
      {initials}
    </span>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
