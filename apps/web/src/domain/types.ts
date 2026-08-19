export type Mode = 'workspace' | 'issue' | 'chat'
export type TaskStatus = 'idle' | 'exploring' | 'proposal' | 'approved' | 'executing' | 'verifying' | 'review'
export type Locale = 'zh-CN' | 'en-US'
export type ProviderConnectionKind = 'openai-compatible' | 'anthropic' | 'mock'

export interface ProviderConnection {
  provider: ProviderConnectionKind
  apiKey: string
  baseUrl: string
  model: string
}

export interface GitHubContext {
  repository: string
  description: string | null
  defaultBranch: string
  readme: string
  files: string[]
  issues: Array<{ number: number; title: string; state: string }>
}

export interface GitHubReadEvidence {
  repository: string
  path: string
  sha?: string
  readAt: string
}

export interface AppState {
  locale: Locale
  projectId: string | null
  mode: Mode | null
  taskStatus: TaskStatus
  githubContext?: GitHubContext
  githubReadEvidence: GitHubReadEvidence[]
  connection?: ProviderConnection
}
