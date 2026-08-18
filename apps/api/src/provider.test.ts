import { describe, expect, it } from 'vitest'
import { MockProvider } from './mock-provider.js'
import { ProviderRegistry } from './provider-registry.js'
import type { ModelProvider } from './provider.js'

async function collect(provider: ModelProvider) {
  const events = []
  for await (const event of provider.run({ taskId: 'task-1', message: 'inspect retries' })) events.push(event)
  return events
}

describe('provider contracts', () => {
  it('emits a deterministic mock trajectory in protocol order', async () => {
    const events = await collect(new MockProvider())

    expect(events).toEqual([
      { type: 'model.message', actor: 'coordinator', summary: 'Mock provider understood: inspect retries' },
      { type: 'tool.started', actor: 'explorer', tool: 'readFile', summary: 'readFile started' },
      { type: 'tool.completed', actor: 'explorer', tool: 'readFile', summary: 'readFile completed' }
    ])
  })

  it('uses the mock provider by default and rejects unknown providers', () => {
    const mock = new MockProvider()
    const registry = new ProviderRegistry([mock])

    expect(registry.get()).toBe(mock)
    expect(registry.get('mock')).toBe(mock)
    expect(() => registry.get('missing')).toThrow('Unknown provider: missing')
  })
})
