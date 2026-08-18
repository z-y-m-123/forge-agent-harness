import { createEventLog } from './agent-events'
import { runToolStep } from './execution-runner'
import { createTaskSpec } from './task-contract'

export function runDemoExecution(approved: boolean) {
  const draft = createTaskSpec({
    id: 'demo-retry-318',
    projectId: 'api-service',
    outcome: 'Preserve retry context',
    inScopeFiles: ['src/http/retry.ts'],
    acceptanceEvidence: ['Focused test passes']
  })
  const task = approved
    ? { ...draft, approval: { status: 'approved' as const, approvedAt: '2026-08-18T00:00:00.000Z' } }
    : draft

  return runToolStep({
    task,
    log: createEventLog(task.id),
    tool: 'readFile',
    now: () => new Date('2026-08-18T00:00:00.000Z'),
    run: async () => 'demo source excerpt'
  })
}
