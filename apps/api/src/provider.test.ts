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
      {
        type: 'task.spec',
        actor: 'planner',
        summary: 'Task Spec ready for approval',
        data: {
          outcome: 'Inspect retry handling without editing code',
          inScopeFiles: ['src/http/retry.ts', 'src/http/retry.test.ts'],
          acceptanceEvidence: ['Focused test evidence', 'Reviewable read-only trace']
        }
      },
      { type: 'tool.requested', actor: 'explorer', tool: 'readFile', summary: 'readFile requested' }
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
