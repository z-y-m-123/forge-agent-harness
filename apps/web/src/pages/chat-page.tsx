import { Send, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { TaskSpecPanel } from '../components/task-spec-panel'
import { useApp } from '../app'
import { streamAgentRun } from '../domain/agent-api'
import { isApiConfigured } from '../domain/api-url'

type ChatMessage = { id: number; role: 'user' | 'agent'; text: string; local?: boolean }

function createLocalReply(message: string) {
  return `我已记录任务：“${message}”。当前处于只读探索阶段，我会先梳理相关调用链、项目约定与验证证据；在你批准 Task Spec 前，不会修改代码、执行命令或创建 PR。`
}

export function ChatPage() {
  const { state, dispatch } = useApp()
  const github = state.githubContext
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 1, role: 'agent', text: '描述你想完成的任务。我会先把目标、范围和不确定点整理清楚，再生成待你批准的任务说明。' }])
  const latestTask = [...messages].reverse().find(message => message.role === 'user')?.text
  const readme = github?.readme.split('\n').map(line => line.trim()).find(line => line && !line.startsWith('#'))
  const taskId = github ? `chat-${github.repository.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}` : 'chat-explore'

  const send = async (event: FormEvent) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending) return
    setDraft('')
    setSending(true)
    setMessages(current => [...current, { id: Date.now(), role: 'user', text: message }])
    try {
      if (!isApiConfigured && !import.meta.env.DEV) {
        setMessages(current => [...current, { id: Date.now() + 1, role: 'agent', text: createLocalReply(message), local: true }])
        return
      }
      const events = await streamAgentRun({ taskId, message, approved: false, connection: state.connection })
      const reply = events.find(item => item.type === 'model.message')?.summary ?? createLocalReply(message)
      setMessages(current => [...current, { id: Date.now() + 1, role: 'agent', text: reply }])
    } catch {
      setMessages(current => [...current, { id: Date.now() + 1, role: 'agent', text: '暂时无法连接模型服务。你仍可先创建 Task Spec，并在连接服务后继续探索。' }])
    } finally {
      setSending(false)
    }
  }

  return <main className="chat-page"><section className="conversation"><p className="eyebrow">自由对话 · Explore</p><div className="chat-thread" aria-live="polite">{messages.map(message => <div className={`chat ${message.role}`} key={message.id}>{message.role === 'agent' && <Sparkles size={17} />}<div>{message.text}{message.local && <strong className="mock-reply">本地 Mock</strong>}</div></div>)}</div><form className="chat-composer" onSubmit={send}><label htmlFor="chat-task">任务描述</label><textarea id="chat-task" value={draft} onChange={event => setDraft(event.target.value)} placeholder="描述你想探索或交付的任务" rows={4} disabled={sending} /><div><small>{isApiConfigured ? '会话将使用当前模型连接；仍需批准 Task Spec 才能进入执行。' : '静态站未连接 API，将生成本地 Mock 探索回复。'}</small><button className="button primary" type="submit" disabled={sending || !draft.trim()}>{sending ? '探索中...' : <><Send size={16} />发送</>}</button></div></form>{state.taskStatus !== 'idle' ? <TaskSpecPanel outcome={latestTask} /> : <button className="button quiet task-spec-trigger" onClick={() => dispatch({ type: 'taskProposed' })} disabled={!latestTask}>基于当前任务创建 Task Spec</button>}</section><aside className="project-lens"><h2>Project lens</h2>{github ? <><article><b>GitHub 事实</b><p>{github.repository} · {github.defaultBranch}</p><p>{readme || 'README 暂无可用摘要'}</p></article><article><b>代码事实</b><p>{github.files.length} 个文件已读取</p>{github.files.length ? <p className="context-items">{github.files.slice(0, 3).map(file => <span key={file}>{file}</span>)}</p> : <p>文件树为空</p>}</article><article><b>开放 Issue</b>{github.issues.length ? <p className="context-items">{github.issues.slice(0, 3).map(issue => <span key={issue.number}>#{issue.number} {issue.title}</span>)}</p> : <p>暂无开放 Issue</p>}</article></> : <><article><b>项目上下文</b><p>尚未连接仓库。自由对话可先澄清任务，再转入项目工作台。</p></article><article><b>责任边界</b><p>默认只读探索；任何写入、测试或 PR 都必须在后续批准后执行。</p></article></>}<article className="decision"><b>需要用户决定</b><p>是否把当前任务转换为可审阅的 Task Spec？</p></article></aside></main>
}
