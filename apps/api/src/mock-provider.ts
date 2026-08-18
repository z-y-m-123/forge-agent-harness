import type { AgentEventInput, RunRequest } from './contracts.js'
import type { ModelProvider } from './provider.js'

export class MockProvider implements ModelProvider {
  readonly id = 'mock'

  async *run(input: RunRequest): AsyncIterable<AgentEventInput> {
    yield { type: 'model.message', actor: 'coordinator', summary: `Mock provider understood: ${input.message}` }
    yield {
      type: 'task.spec',
      actor: 'planner',
      summary: 'Task Spec ready for approval',
      data: {
        outcome: 'Inspect retry handling without editing code',
        inScopeFiles: ['src/http/retry.ts', 'src/http/retry.test.ts'],
        acceptanceEvidence: ['Focused test evidence', 'Reviewable read-only trace']
      }
    }
    yield { type: 'tool.requested', actor: 'explorer', tool: 'readFile', summary: 'readFile requested' }
  }
}
