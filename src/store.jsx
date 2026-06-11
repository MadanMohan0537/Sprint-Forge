import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { seedSprints, seedStories, seedAudit, seedBurndown, seedRetros } from './data/seed.js'

const STORAGE_KEY = 'sprintforge-state-v1'
const CURRENT_USER = 'Ana Reyes' // demo: acting user for audit attribution

const StoreContext = createContext(null)

function freshState() {
  return {
    sprints: seedSprints,
    stories: seedStories,
    auditLog: seedAudit,
    burndown: seedBurndown,
    retros: seedRetros,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.sprints && parsed.stories) return parsed
    }
  } catch {
    /* corrupted state -> reseed */
  }
  return freshState()
}

let idCounter = Date.now()
const uid = (prefix) => `${prefix}${(idCounter++).toString(36)}`

function appendAudit(state, entry) {
  return [
    ...state.auditLog,
    {
      id: uid('a'),
      ts: new Date().toISOString(),
      user: CURRENT_USER,
      ...entry,
    },
  ]
}

function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      return freshState()

    case 'addStory': {
      const story = {
        id: uid('st'),
        title: 'Untitled story',
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
        createdAt: new Date().toISOString().slice(0, 10),
        ...action.story,
      }
      return {
        ...state,
        stories: [...state.stories, story],
        auditLog: appendAudit(state, {
          storyId: story.id,
          storyTitle: story.title,
          action: 'created',
          from: null,
          to: story.status,
          compliance: story.compliance,
        }),
      }
    }

    case 'updateStory': {
      const prev = state.stories.find((s) => s.id === action.id)
      if (!prev) return state
      const next = { ...prev, ...action.patch }
      const entries = []
      if (action.patch.status && action.patch.status !== prev.status) {
        entries.push({
          storyId: next.id,
          storyTitle: next.title,
          action: 'status-change',
          from: prev.status,
          to: next.status,
          compliance: next.compliance,
        })
      } else {
        entries.push({
          storyId: next.id,
          storyTitle: next.title,
          action: 'edited',
          from: null,
          to: null,
          compliance: next.compliance,
        })
      }
      let auditLog = state.auditLog
      for (const e of entries) auditLog = appendAudit({ ...state, auditLog }, e)
      return {
        ...state,
        stories: state.stories.map((s) => (s.id === action.id ? next : s)),
        auditLog,
      }
    }

    case 'deleteStory': {
      const prev = state.stories.find((s) => s.id === action.id)
      if (!prev) return state
      return {
        ...state,
        stories: state.stories.filter((s) => s.id !== action.id),
        auditLog: appendAudit(state, {
          storyId: prev.id,
          storyTitle: prev.title,
          action: 'deleted',
          from: prev.status,
          to: null,
          compliance: prev.compliance,
        }),
      }
    }

    case 'commitToSprint': {
      const prev = state.stories.find((s) => s.id === action.id)
      if (!prev) return state
      const sprint = state.sprints.find((s) => s.active)
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.id ? { ...s, sprintId: sprint.id, status: 'todo' } : s,
        ),
        auditLog: appendAudit(state, {
          storyId: prev.id,
          storyTitle: prev.title,
          action: 'sprint-commit',
          from: 'backlog',
          to: 'todo',
          compliance: prev.compliance,
        }),
      }
    }

    case 'returnToBacklog': {
      const prev = state.stories.find((s) => s.id === action.id)
      if (!prev) return state
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.id ? { ...s, sprintId: null, status: 'backlog' } : s,
        ),
        auditLog: appendAudit(state, {
          storyId: prev.id,
          storyTitle: prev.title,
          action: 'descope',
          from: prev.status,
          to: 'backlog',
          compliance: prev.compliance,
        }),
      }
    }

    case 'saveRetro':
      return { ...state, retros: [...state.retros, action.retro] }

    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full / unavailable — demo continues in memory */
    }
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

// ---- Derived selectors -----------------------------------------------------

export function activeSprint(state) {
  return state.sprints.find((s) => s.active)
}

export function sprintStories(state, sprintId) {
  return state.stories.filter((s) => s.sprintId === sprintId)
}

export function backlogStories(state) {
  return state.stories.filter((s) => !s.sprintId)
}

export function donePoints(stories) {
  return stories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.points, 0)
}

export function totalPoints(stories) {
  return stories.reduce((sum, s) => sum + s.points, 0)
}
