import { describe, expect, it } from 'vitest'
import { appReducer, initialAppState } from '../state/app-reducer'

describe('appReducer', () => {
  it('selects a project before a mode can be selected', () => {
    const ignored = appReducer(initialAppState, { type: 'modeSelected', mode: 'workspace' })
    const selected = appReducer(initialAppState, { type: 'projectSelected', projectId: 'api-service' })

    expect(ignored.mode).toBeNull()
    expect(selected.projectId).toBe('api-service')
  })

  it('requires approval before executing a task', () => {
    const proposed = appReducer(initialAppState, { type: 'taskProposed' })
    const ignored = appReducer(proposed, { type: 'executionStarted' })
    const approved = appReducer(proposed, { type: 'taskApproved' })
    const executing = appReducer(approved, { type: 'executionStarted' })

    expect(ignored.taskStatus).toBe('proposal')
    expect(executing.taskStatus).toBe('executing')
  })

  it('returns execution to proposal when a scope amendment is requested', () => {
    const executing = { ...initialAppState, taskStatus: 'executing' as const }
    expect(appReducer(executing, { type: 'scopeAmendmentRequested' }).taskStatus).toBe('proposal')
  })
})
