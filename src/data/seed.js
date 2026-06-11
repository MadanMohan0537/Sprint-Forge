// Seed data for SprintForge demo — a fintech payments team ("Atlas Pay")
// mid-way through Sprint 8. Dates are generated relative to "today" so the
// demo always looks live.

const DAY = 86400000
const today = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const iso = (d) => d.toISOString().slice(0, 10)
const daysAgo = (n) => iso(new Date(today().getTime() - n * DAY))
const daysAhead = (n) => iso(new Date(today().getTime() + n * DAY))

export const TEAM = ['Ana Reyes', 'Dev Patel', 'Mia Chen', 'Tom Okafor', 'Sara Kim']

export const COMPLIANCE_FRAMEWORKS = ['SOX', 'KYC/AML', 'PCI-DSS', 'GDPR']

export const STATUSES = ['backlog', 'todo', 'inprogress', 'review', 'done']

export const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

// ---- Sprints -------------------------------------------------------------
// 5 completed sprints (velocity history) + 1 active sprint (Sprint 8).
// The active sprint started 7 working days ago and ends 4 days ahead.

export const seedSprints = [
  { id: 's3', name: 'Sprint 3', goal: 'Ledger service foundations', start: daysAgo(85), end: daysAgo(72), committed: 30, completed: 24, active: false },
  { id: 's4', name: 'Sprint 4', goal: 'Card tokenization MVP', start: daysAgo(71), end: daysAgo(58), committed: 32, completed: 29, active: false },
  { id: 's5', name: 'Sprint 5', goal: 'KYC onboarding flow', start: daysAgo(57), end: daysAgo(44), committed: 34, completed: 27, active: false },
  { id: 's6', name: 'Sprint 6', goal: 'Payout scheduling + retries', start: daysAgo(43), end: daysAgo(30), committed: 33, completed: 31, active: false },
  { id: 's7', name: 'Sprint 7', goal: 'SOX audit-trail hardening', start: daysAgo(29), end: daysAgo(16), committed: 36, completed: 33, active: false },
  { id: 's8', name: 'Sprint 8', goal: 'PCI scope reduction & dispute flow', start: daysAgo(9), end: daysAhead(4), committed: 34, completed: null, active: true },
]

// Burndown snapshots for the active sprint's elapsed days (remaining points
// at end of each day). Today onward is computed live from story state.
export const seedBurndown = [
  { date: daysAgo(9), remaining: 34 },
  { date: daysAgo(8), remaining: 34 },
  { date: daysAgo(7), remaining: 31 },
  { date: daysAgo(6), remaining: 29 },
  { date: daysAgo(5), remaining: 26 },
  { date: daysAgo(4), remaining: 26 },
  { date: daysAgo(3), remaining: 21 },
  { date: daysAgo(2), remaining: 18 },
  { date: daysAgo(1), remaining: 16 },
]

// ---- Stories -------------------------------------------------------------
// value/effort are 1–5 (used by the prioritization matrix).
// compliance: null or a framework string; complianceNote = control reference.

let n = 0
const story = (over) => ({
  id: 'st' + ++n,
  title: '',
  description: '',
  epic: 'General',
  points: 3,
  value: 3,
  effort: 3,
  status: 'backlog',
  sprintId: null,
  assignee: null,
  labels: [],
  compliance: null,
  complianceNote: '',
  createdAt: daysAgo(20),
  ...over,
})

export const seedStories = [
  // --- Sprint 8 (active): done = 18 pts, rest in flight -------------------
  story({ title: 'Vault migration for stored PANs', epic: 'PCI Scope Reduction', points: 8, value: 5, effort: 4, status: 'done', sprintId: 's8', assignee: 'Dev Patel', labels: ['security'], compliance: 'PCI-DSS', complianceNote: 'Req 3.4 — render PAN unreadable' }),
  story({ title: 'Dispute intake form & case ID generation', epic: 'Dispute Flow', points: 5, value: 4, effort: 3, status: 'done', sprintId: 's8', assignee: 'Mia Chen', labels: ['frontend'] }),
  story({ title: 'Chargeback reason-code mapping table', epic: 'Dispute Flow', points: 3, value: 3, effort: 2, status: 'done', sprintId: 's8', assignee: 'Sara Kim', labels: ['backend'] }),
  story({ title: 'Network segmentation tests for CDE', epic: 'PCI Scope Reduction', points: 2, value: 4, effort: 2, status: 'done', sprintId: 's8', assignee: 'Tom Okafor', labels: ['security'], compliance: 'PCI-DSS', complianceNote: 'Req 11.3 — segmentation pen test' }),
  story({ title: 'Dispute evidence upload (S3 presigned)', epic: 'Dispute Flow', points: 5, value: 4, effort: 3, status: 'inprogress', sprintId: 's8', assignee: 'Mia Chen', labels: ['backend'] }),
  story({ title: 'Tokenization fallback for legacy gateway', epic: 'PCI Scope Reduction', points: 5, value: 4, effort: 4, status: 'inprogress', sprintId: 's8', assignee: 'Dev Patel', labels: ['backend'], compliance: 'PCI-DSS', complianceNote: 'Req 3.4 — legacy path remediation' }),
  story({ title: 'Dispute status webhooks for merchants', epic: 'Dispute Flow', points: 3, value: 3, effort: 2, status: 'review', sprintId: 's8', assignee: 'Sara Kim', labels: ['api'] }),
  story({ title: 'Quarterly access review automation', epic: 'Compliance Ops', points: 3, value: 3, effort: 2, status: 'todo', sprintId: 's8', assignee: 'Ana Reyes', labels: ['internal'], compliance: 'SOX', complianceNote: 'ITGC — logical access review' }),

  // --- Backlog (groomed, not yet committed) -------------------------------
  story({ title: 'Real-time sanctions screening on payouts', epic: 'Compliance Ops', points: 8, value: 5, effort: 4, compliance: 'KYC/AML', complianceNote: 'OFAC screening pre-disbursement' }),
  story({ title: 'Merchant risk-tier auto-classification', epic: 'Risk Engine', points: 8, value: 5, effort: 5, labels: ['ml'] }),
  story({ title: 'One-click dispute response templates', epic: 'Dispute Flow', points: 3, value: 4, effort: 2, labels: ['frontend'] }),
  story({ title: 'Instant payout eligibility rules', epic: 'Payouts', points: 5, value: 5, effort: 3 }),
  story({ title: 'Consent audit log for marketing data', epic: 'Compliance Ops', points: 3, value: 2, effort: 2, compliance: 'GDPR', complianceNote: 'Art. 7 — proof of consent' }),
  story({ title: 'Dark mode for merchant dashboard', epic: 'General', points: 2, value: 2, effort: 1, labels: ['frontend'] }),
  story({ title: 'Re-platform reporting to columnar store', epic: 'Risk Engine', points: 13, value: 3, effort: 5, labels: ['infra'] }),
  story({ title: 'Beneficial-ownership (UBO) collection UI', epic: 'Compliance Ops', points: 5, value: 4, effort: 3, compliance: 'KYC/AML', complianceNote: 'FinCEN CDD rule — UBO ≥25%' }),
  story({ title: 'Idempotency keys on payment API', epic: 'Payouts', points: 3, value: 4, effort: 2, labels: ['api'] }),
  story({ title: 'In-app NPS survey widget', epic: 'General', points: 2, value: 2, effort: 2 }),
]

// ---- Audit trail (seed: changes already made this sprint) -----------------

let a = 0
const audit = (over) => ({ id: 'a' + ++a, ...over })

export const seedAudit = [
  audit({ ts: daysAgo(9) + 'T09:15:00Z', user: 'Ana Reyes', storyId: 'st1', storyTitle: 'Vault migration for stored PANs', action: 'sprint-commit', from: 'backlog', to: 'todo', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(7) + 'T11:02:00Z', user: 'Dev Patel', storyId: 'st1', storyTitle: 'Vault migration for stored PANs', action: 'status-change', from: 'todo', to: 'inprogress', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(6) + 'T16:40:00Z', user: 'Tom Okafor', storyId: 'st4', storyTitle: 'Network segmentation tests for CDE', action: 'status-change', from: 'todo', to: 'inprogress', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(4) + 'T10:22:00Z', user: 'Tom Okafor', storyId: 'st4', storyTitle: 'Network segmentation tests for CDE', action: 'status-change', from: 'inprogress', to: 'done', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(3) + 'T14:05:00Z', user: 'Dev Patel', storyId: 'st1', storyTitle: 'Vault migration for stored PANs', action: 'status-change', from: 'inprogress', to: 'review', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(2) + 'T09:48:00Z', user: 'Ana Reyes', storyId: 'st1', storyTitle: 'Vault migration for stored PANs', action: 'status-change', from: 'review', to: 'done', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(2) + 'T15:30:00Z', user: 'Dev Patel', storyId: 'st6', storyTitle: 'Tokenization fallback for legacy gateway', action: 'status-change', from: 'todo', to: 'inprogress', compliance: 'PCI-DSS' }),
  audit({ ts: daysAgo(1) + 'T10:10:00Z', user: 'Mia Chen', storyId: 'st5', storyTitle: 'Dispute evidence upload (S3 presigned)', action: 'status-change', from: 'todo', to: 'inprogress', compliance: null }),
]

// ---- Past retrospectives (used for recurring-theme detection) -------------

export const seedRetros = [
  {
    id: 'r7',
    sprintId: 's7',
    sprintName: 'Sprint 7',
    date: daysAgo(16),
    themes: ['scope creep', 'testing', 'communication'],
    summary: 'Audit-trail work landed, but mid-sprint scope additions cost ~3 pts.',
  },
  {
    id: 'r6',
    sprintId: 's6',
    sprintName: 'Sprint 6',
    date: daysAgo(30),
    themes: ['dependencies', 'scope creep'],
    summary: 'Payout retries shipped; blocked 2 days waiting on infra team.',
  },
]
