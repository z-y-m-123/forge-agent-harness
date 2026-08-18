import { describe, expect, it } from 'vitest'
import { canExecuteTask, createTaskSpec, createVerificationReport } from '../domain/task-contract'

describe('task contract', () => {
  it('does not allow execution until the user has explicitly approved the task spec', () => {
    const draft = createTaskSpec({
      id: 'task-318',
      projectId: 'api-service',
      outcome: 'Preserve trace IDs during safe retries',
      inScopeFiles: ['src/http/retry.ts'],
      acceptanceEvidence: ['Focused retry test passes']
    })

    expect(canExecuteTask(draft)).toBe(false)
    expect(canExecuteTask({ ...draft, approval: { status: 'approved', approvedAt: '2026-08-18T04:00:00.000Z' } })).toBe(true)
  })

  it('requires verification evidence before a report can be marked passed', () => {
    expect(() => createVerificationReport({ taskId: 'task-318', status: 'passed', evidence: [] })).toThrow('Passed verification requires evidence')
  })
})
