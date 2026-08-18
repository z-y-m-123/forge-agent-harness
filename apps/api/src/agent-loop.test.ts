import { describe, expect, it } from 'vitest'
import { runAgentLoop } from './agent-loop.js'
import { MockProvider } from './mock-provider.js'
import type { RunRequest } from './contracts.js'

async function collect(input: RunRequest) {
  const events = []
  for await (const event of runAgentLoop(new MockProvider(), input)) events.push(event)
  return events
}

describe('agent loop approval boundary', () => {
  it('returns a structured task and tool request without executing a tool before approval', async () => {
    const events = await collect({ taskId: 'task-1', message: 'inspect retries' })

    expect(events.map(event => event.type)).toEqual(['model.message', 'task.spec', 'tool.requested'])
    expect(events.at(-1)?.tool).toBe('readFile')
  })

  it('executes only the requested read-only tool after approval', async () => {
    const events = await collect({ taskId: 'task-1', message: 'inspect retries', approved: true })

    expect(events.map(event => event.type)).toEqual([
      'model.message',
      'task.spec',
      'tool.requested',
      'tool.started',
      'tool.completed'
    ])
    expect(events.at(-1)?.data).toEqual({ output: 'demo source excerpt' })
  })

  it('normalizes a plain provider message into the same structured plan boundary', async () => {
    const plainProvider = {
      id: 'plain',
      async *run() {
        yield { type: 'model.message' as const, actor: 'coordinator' as const, summary: 'I will inspect retries.' }
      }
    }
    const events = []
    for await (const event of runAgentLoop(plainProvider, { taskId: 'task-1', message: 'inspect retries' })) events.push(event)

    expect(events.map(event => event.type)).toEqual(['model.message', 'task.spec', 'tool.requested'])
  })
})
