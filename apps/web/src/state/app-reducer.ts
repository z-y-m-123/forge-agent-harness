import type { AppState, GitHubContext, GitHubReadEvidence, Locale, Mode } from '../domain/types'

export type AppAction =
  | { type: 'projectSelected'; projectId: string }
  | { type: 'modeSelected'; mode: Mode }
  | { type: 'taskProposed' }
  | { type: 'taskApproved' }
  | { type: 'executionStarted' }
  | { type: 'scopeAmendmentRequested' }
  | { type: 'githubContextLoaded'; context: GitHubContext }
  | { type: 'githubFileRead'; evidence: GitHubReadEvidence }
  | { type: 'localeChanged'; locale: Locale }

export const initialAppState: AppState = {
  locale: 'zh-CN',
  projectId: null,
  mode: null,
  taskStatus: 'idle',
  githubReadEvidence: []
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'projectSelected':
      return { ...state, projectId: action.projectId || null, mode: null, taskStatus: 'idle', githubContext: action.projectId.includes('/') ? state.githubContext : undefined }
    case 'modeSelected':
      return state.projectId ? { ...state, mode: action.mode } : state
    case 'taskProposed':
      return { ...state, taskStatus: 'proposal' }
    case 'taskApproved':
      return state.taskStatus === 'proposal' ? { ...state, taskStatus: 'approved' } : state
    case 'executionStarted':
      return state.taskStatus === 'approved' ? { ...state, taskStatus: 'executing' } : state
    case 'scopeAmendmentRequested':
      return { ...state, taskStatus: 'proposal' }
    case 'githubContextLoaded':
      return { ...state, projectId: action.context.repository, mode: null, taskStatus: 'idle', githubContext: action.context, githubReadEvidence: [] }
    case 'githubFileRead': {
      const { repository, path } = action.evidence
      const withoutExisting = state.githubReadEvidence.filter(item => item.repository !== repository || item.path !== path)
      return { ...state, githubReadEvidence: [...withoutExisting, action.evidence] }
    }
    case 'localeChanged':
      return { ...state, locale: action.locale }
    default:
      return state
  }
}
