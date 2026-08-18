import type { AgentEventInput, RunRequest } from './contracts.js'

export interface ModelProvider {
  readonly id: string
  run(input: RunRequest): AsyncIterable<AgentEventInput>
}
