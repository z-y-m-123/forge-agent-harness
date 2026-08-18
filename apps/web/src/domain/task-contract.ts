export type Approval =
  | { status: 'pending' }
  | { status: 'approved'; approvedAt: string }

export interface TaskSpec {
  id: string
  projectId: string
  outcome: string
  inScopeFiles: string[]
  acceptanceEvidence: string[]
  approval: Approval
}

export interface VerificationEvidence {
  kind: 'test' | 'diff' | 'command'
  label: string
  detail: string
}

export interface VerificationReport {
  taskId: string
  status: 'passed' | 'failed'
  evidence: VerificationEvidence[]
}

export function createTaskSpec(input: Omit<TaskSpec, 'approval'>): TaskSpec {
  return { ...input, approval: { status: 'pending' } }
}

export function canExecuteTask(spec: TaskSpec): boolean {
  return spec.approval.status === 'approved'
}

export function createVerificationReport(report: VerificationReport): VerificationReport {
  if (report.status === 'passed' && report.evidence.length === 0) {
    throw new Error('Passed verification requires evidence')
  }

  return report
}
