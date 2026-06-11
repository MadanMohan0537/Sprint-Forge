import React, { useState } from 'react'
import { Modal } from './ui.jsx'
import { TEAM, COMPLIANCE_FRAMEWORKS } from '../data/seed.js'

const FIB = [1, 2, 3, 5, 8, 13]

export default function StoryModal({ story, onSave, onClose }) {
  const [form, setForm] = useState(
    story || {
      title: '',
      description: '',
      epic: 'General',
      points: 3,
      value: 3,
      effort: 3,
      assignee: '',
      compliance: '',
      complianceNote: '',
    },
  )
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      ...form,
      points: Number(form.points),
      value: Number(form.value),
      effort: Number(form.effort),
      assignee: form.assignee || null,
      compliance: form.compliance || null,
    })
    onClose()
  }

  return (
    <Modal title={story ? 'Edit story' : 'New story'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="As a merchant, I want…"
            autoFocus
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Epic</label>
            <input className="input" value={form.epic} onChange={(e) => set('epic', e.target.value)} />
          </div>
          <div>
            <label className="label">Assignee</label>
            <select className="input" value={form.assignee || ''} onChange={(e) => set('assignee', e.target.value)}>
              <option value="">Unassigned</option>
              {TEAM.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Story points (Fibonacci)</label>
          <div className="flex gap-2">
            {FIB.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => set('points', p)}
                className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                  Number(form.points) === p
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-surface border-edge text-slate-400 hover:border-indigo-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Business value: {form.value}/5</label>
            <input type="range" min="1" max="5" value={form.value} onChange={(e) => set('value', e.target.value)} className="w-full accent-indigo-500" />
          </div>
          <div>
            <label className="label">Effort: {form.effort}/5</label>
            <input type="range" min="1" max="5" value={form.effort} onChange={(e) => set('effort', e.target.value)} className="w-full accent-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Compliance framework</label>
            <select className="input" value={form.compliance || ''} onChange={(e) => set('compliance', e.target.value)}>
              <option value="">None</option>
              {COMPLIANCE_FRAMEWORKS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          {form.compliance && (
            <div>
              <label className="label">Control reference</label>
              <input
                className="input"
                value={form.complianceNote}
                onChange={(e) => set('complianceNote', e.target.value)}
                placeholder="e.g. PCI Req 3.4"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" className="btn-primary">{story ? 'Save changes' : 'Add story'}</button>
        </div>
      </form>
    </Modal>
  )
}
