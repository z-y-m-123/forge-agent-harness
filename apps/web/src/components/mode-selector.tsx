import { Code2, ListChecks, MessageSquareText } from 'lucide-react'
import type { Mode } from '../domain/types'
const modes: Array<{ id: Mode; icon: typeof Code2; title: string; body: string }> = [{ id: 'workspace', icon: Code2, title: '代码工作台', body: '围绕代码、测试和证据协作' }, { id: 'issue', icon: ListChecks, title: 'Issue 任务', body: '从 Issue 走到可审阅的交付' }, { id: 'chat', icon: MessageSquareText, title: '自由对话', body: '先探索，再决定是否创建任务' }]
export function ModeSelector({ onSelect }: { onSelect: (mode: Mode) => void }) { return <div className="mode-grid">{modes.map(({ id, icon: Icon, title, body }) => <button className="mode-card" key={id} onClick={() => onSelect(id)}><Icon size={22} /><strong>{title}</strong><span>{body}</span><i>进入 →</i></button>)}</div> }
