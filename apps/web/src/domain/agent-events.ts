export type AgentRole = 'coordinator' | 'explorer' | 'planner' | 'implementer' | 'verifier' | 'reviewer'
export type AgentEventType = 'model.message' | 'tool.started' | 'tool.completed' | 'tool.failed' | 'verification.completed'

export interface AgentEventInput {
  type: AgentEventType
  actor: AgentRole
  summary: string
  tool?: string
}

export interface AgentEvent extends AgentEventInput {
  id: string
  timestamp: string
}

export interface AgentEventLog {
  taskId: string
  events: AgentEvent[]
}

export function createEventLog(taskId: string): AgentEventLog {
  return { taskId, events: [] }
}

export function appendEvent(log: AgentEventLog, input: AgentEventInput, now = new Date()): AgentEventLog {
  const event: AgentEvent = {
    ...input,
    id: `${log.taskId}:${log.events.length + 1}`,
    timestamp: now.toISOString()
  }

  return { ...log, events: [...log.events, event] }
}
