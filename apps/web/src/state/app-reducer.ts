import type { AppState, Locale, Mode } from '../domain/types'

export type AppAction =
  | { type: 'projectSelected'; projectId: string }
  | { type: 'modeSelected'; mode: Mode }
  | { type: 'taskProposed' }
  | { type: 'taskApproved' }
  | { type: 'executionStarted' }
  | { type: 'scopeAmendmentRequested' }
  | { type: 'localeChanged'; locale: Locale }

export const initialAppState: AppState = {
  locale: 'zh-CN',
  projectId: null,
  mode: null,
  taskStatus: 'idle'
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'projectSelected':
      return { ...state, projectId: action.projectId, mode: null, taskStatus: 'idle' }
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
    case 'localeChanged':
      return { ...state, locale: action.locale }
    default:
      return state
  }
}
