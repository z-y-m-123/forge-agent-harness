import { appendEvent, type AgentEventLog } from './agent-events'
import { canExecuteTask, type TaskSpec } from './task-contract'

export interface ToolStep<T> {
  task: TaskSpec
  log: AgentEventLog
  tool: string
  run: () => Promise<T>
  now?: () => Date
}

export type ToolStepResult<T> =
  | { status: 'blocked'; log: AgentEventLog }
  | { status: 'completed'; log: AgentEventLog; output: T }
  | { status: 'failed'; log: AgentEventLog; error: Error }

export async function runToolStep<T>({ task, log, tool, run, now = () => new Date() }: ToolStep<T>): Promise<ToolStepResult<T>> {
  if (!canExecuteTask(task)) return { status: 'blocked', log }

  const started = appendEvent(log, { type: 'tool.started', actor: 'implementer', tool, summary: `${tool} started` }, now())

  try {
    const output = await run()
    return {
      status: 'completed',
      output,
      log: appendEvent(started, { type: 'tool.completed', actor: 'implementer', tool, summary: `${tool} completed` }, now())
    }
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause))
    return {
      status: 'failed',
      error,
      log: appendEvent(started, { type: 'tool.failed', actor: 'implementer', tool, summary: `${tool} failed: ${error.message}` }, now())
    }
  }
}
