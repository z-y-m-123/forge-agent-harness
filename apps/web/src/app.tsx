import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { AppHeader } from './components/app-header'
import { demoProjects } from './domain/demo-data'
import { initialAppState, appReducer, type AppAction } from './state/app-reducer'
import type { AppState } from './domain/types'
import { HomePage } from './pages/home-page'
import { WorkspacePage } from './pages/workspace-page'
import { IssuePage } from './pages/issue-page'
import { ChatPage } from './pages/chat-page'

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(null)
export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('useApp must be inside App'); return context }
export function App({ children }: { children?: ReactNode }) { const [state, dispatch] = useReducer(appReducer, () => ({ ...initialAppState, locale: window.localStorage.getItem('forge-agent.locale') === 'en-US' ? 'en-US' : 'zh-CN' })); const selected = demoProjects.find(item => item.id === state.projectId); const value = useMemo(() => ({ state, dispatch }), [state]); useEffect(() => { window.localStorage.setItem('forge-agent.locale', state.locale); document.documentElement.lang = state.locale }, [state.locale]); const content = children ?? (!state.mode ? <HomePage /> : state.mode === 'workspace' ? <WorkspacePage /> : state.mode === 'issue' ? <IssuePage /> : <ChatPage />); return <AppContext.Provider value={value}><div className="app-shell"><AppHeader locale={state.locale} projectName={selected?.name} onLocaleChange={locale => dispatch({ type: 'localeChanged', locale })} />{content}</div></AppContext.Provider> }
