import { describe, expect, it } from 'vitest'
import { runToolStep } from '../domain/execution-runner'
import { createEventLog } from '../domain/agent-events'
import { createTaskSpec } from '../domain/task-contract'

const task = createTaskSpec({
  id: 'task-318', projectId: 'api-service', outcome: 'Check retry behavior',
  inScopeFiles: ['src/http/retry.ts'], acceptanceEvidence: ['A focused test passes']
})

describe('execution runner', () => {
  it('blocks a tool call until the task has explicit approval', async () => {
    const result = await runToolStep({ task, log: createEventLog(task.id), tool: 'readFile', run: async () => 'source' })

    expect(result.status).toBe('blocked')
    expect(result.log.events).toHaveLength(0)
  })

  it('records start and completion evidence for an approved tool call', async () => {
    const result = await runToolStep({
      task: { ...task, approval: { status: 'approved', approvedAt: '2026-08-18T04:00:00.000Z' } },
      log: createEventLog(task.id), tool: 'readFile', run: async () => 'source'
    })

    expect(result.status).toBe('completed')
    expect(result.log.events.map(event => event.type)).toEqual(['tool.started', 'tool.completed'])
    if (result.status === 'completed') expect(result.output).toBe('source')
  })
})
