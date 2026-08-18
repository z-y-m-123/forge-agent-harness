export type AgentRole = 'coordinator' | 'explorer' | 'planner' | 'implementer' | 'verifier' | 'reviewer'
export type AgentEventType = 'model.message' | 'tool.started' | 'tool.completed' | 'tool.failed' | 'provider.failed' | 'verification.completed'

export interface AgentEventInput {
  type: AgentEventType
  actor: AgentRole
  summary: string
  tool?: string
}

export interface RunRequest {
  taskId: string
  message: string
  provider?: string
}
