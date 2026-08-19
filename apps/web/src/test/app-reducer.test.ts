import { describe, expect, it } from 'vitest'
import { appReducer, initialAppState } from '../state/app-reducer'

const githubContext = {
  repository: 'octo/forge',
  description: 'A useful project',
  defaultBranch: 'main',
  readme: '# Forge',
  files: ['README.md', 'src/index.ts'],
  issues: [{ number: 7, title: 'Improve docs', state: 'open' }]
}

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

  it('stores a loaded GitHub context and clears the previous mode', () => {
    const working = { ...initialAppState, projectId: 'api-service', mode: 'chat' as const, taskStatus: 'proposal' as const }
    const connected = appReducer(working, { type: 'githubContextLoaded', context: githubContext })

    expect(connected.projectId).toBe('octo/forge')
    expect(connected.mode).toBeNull()
    expect(connected.taskStatus).toBe('idle')
    expect(connected.githubContext).toEqual(githubContext)
  })

  it('stores GitHub file read evidence and replaces repeated paths at the end', () => {
    const first = { repository: 'octo/forge', path: 'README.md', sha: 'readme-sha', readAt: '2026-08-19T09:00:00.000Z' }
    const second = { repository: 'octo/forge', path: 'src/index.ts', sha: 'file-sha', readAt: '2026-08-19T10:00:00.000Z' }
    const replacement = { ...second, sha: 'new-file-sha', readAt: '2026-08-19T11:00:00.000Z' }

    const withFirst = appReducer(initialAppState, { type: 'githubFileRead', evidence: first })
    const withSecond = appReducer(withFirst, { type: 'githubFileRead', evidence: second })
    const withReplacement = appReducer(withSecond, { type: 'githubFileRead', evidence: replacement })

    expect(withReplacement.githubReadEvidence).toEqual([first, replacement])
  })

  it('clears GitHub read evidence when a different repository is loaded', () => {
    const evidence = { repository: 'octo/forge', path: 'src/index.ts', sha: 'file-sha', readAt: '2026-08-19T10:00:00.000Z' }
    const working = appReducer(initialAppState, { type: 'githubFileRead', evidence })
    const connected = appReducer(working, { type: 'githubContextLoaded', context: { ...githubContext, repository: 'other/service' } })

    expect(connected.githubReadEvidence).toEqual([])
  })
})
