import type { AgentEventInput, RunRequest } from './contracts.js'
import { executeReadOnlyTool } from './read-only-tools.js'
import type { ModelProvider } from './provider.js'

export async function* runAgentLoop(provider: ModelProvider, input: RunRequest): AsyncIterable<AgentEventInput> {
  let hasTaskSpec = false
  let hasToolRequest = false

  for await (const event of provider.run(input)) {
    yield event
    hasTaskSpec ||= event.type === 'task.spec'
    hasToolRequest ||= event.type === 'tool.requested'

    if (event.type !== 'tool.requested' || !input.approved) continue

    const tool = event.tool ?? ''
    yield { type: 'tool.started', actor: 'explorer', tool, summary: `${tool} started` }
    try {
      const output = await executeReadOnlyTool(tool)
      yield { type: 'tool.completed', actor: 'explorer', tool, summary: `${tool} completed`, data: { output } }
    } catch {
      yield { type: 'tool.failed', actor: 'explorer', tool, summary: `${tool} failed` }
    }
  }

  if (!hasTaskSpec) {
    yield {
      type: 'task.spec',
      actor: 'planner',
      summary: 'Task Spec ready for approval',
      data: {
        outcome: input.message,
        inScopeFiles: [],
        acceptanceEvidence: ['Reviewable read-only trace']
      }
    }
  }
  if (!hasToolRequest) {
    yield { type: 'tool.requested', actor: 'explorer', tool: 'readFile', summary: 'readFile requested' }
    if (input.approved) {
      yield { type: 'tool.started', actor: 'explorer', tool: 'readFile', summary: 'readFile started' }
      const output = await executeReadOnlyTool('readFile')
      yield { type: 'tool.completed', actor: 'explorer', tool: 'readFile', summary: 'readFile completed', data: { output } }
    }
  }
}
