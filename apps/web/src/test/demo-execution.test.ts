import { describe, expect, it } from 'vitest'
import { runDemoExecution } from '../domain/demo-execution'

describe('demo execution', () => {
  it('blocks the local demonstration until its task spec is approved', async () => {
    const result = await runDemoExecution(false)

    expect(result.status).toBe('blocked')
    expect(result.log.events).toHaveLength(0)
  })

  it('records only the deterministic read step after approval', async () => {
    const result = await runDemoExecution(true)

    expect(result.status).toBe('completed')
    expect(result.log.events.map(event => event.type)).toEqual(['tool.started', 'tool.completed'])
    if (result.status === 'completed') expect(result.output).toBe('demo source excerpt')
  })
})
