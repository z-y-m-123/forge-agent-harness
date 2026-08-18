import { describe, expect, it } from 'vitest'
import { appendEvent, createEventLog } from '../domain/agent-events'

describe('agent event log', () => {
  it('keeps the event order used to reconstruct an execution trajectory', () => {
    const started = appendEvent(createEventLog('task-318'), {
      type: 'tool.started',
      actor: 'explorer',
      tool: 'searchCode',
      summary: 'Searching retry call sites'
    })
    const completed = appendEvent(started, {
      type: 'tool.completed',
      actor: 'explorer',
      tool: 'searchCode',
      summary: 'Found 3 call sites'
    })

    expect(completed.events.map(event => event.type)).toEqual(['tool.started', 'tool.completed'])
    expect(completed.events.every(event => event.timestamp)).toBe(true)
  })
})
