import type { AgentEventInput, RunRequest } from './contracts.js'
import type { ModelProvider } from './provider.js'

export class MockProvider implements ModelProvider {
  readonly id = 'mock'

  async *run(input: RunRequest): AsyncIterable<AgentEventInput> {
    yield { type: 'model.message', actor: 'coordinator', summary: `Mock provider understood: ${input.message}` }
    yield { type: 'tool.started', actor: 'explorer', tool: 'readFile', summary: 'readFile started' }
    yield { type: 'tool.completed', actor: 'explorer', tool: 'readFile', summary: 'readFile completed' }
  }
}
