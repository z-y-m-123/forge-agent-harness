export type Mode = 'workspace' | 'issue' | 'chat'
export type TaskStatus = 'idle' | 'exploring' | 'proposal' | 'approved' | 'executing' | 'verifying' | 'review'
export type Locale = 'zh-CN' | 'en-US'

export interface AppState {
  locale: Locale
  projectId: string | null
  mode: Mode | null
  taskStatus: TaskStatus
}
