import { CheckCircle2, FileCode2, TestTube2 } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../app'
import { TaskSpecPanel } from '../components/task-spec-panel'
import { streamAgentRun } from '../domain/agent-api'
import { appendEvent, createEventLog, type AgentEventLog } from '../domain/agent-events'
import { runDemoExecution } from '../domain/demo-execution'

const demoFiles = ['src/http/retry.ts', 'src/http/retry.test.ts', 'tests']

export function WorkspacePage() {
  const { state } = useApp()
  const github = state.githubContext
  const repository = github?.repository ?? 'acme/api-service'
  const files = github?.files.length ? github.files : demoFiles
  const selectedFile = files.find(file => /\.(ts|tsx|js|jsx|py|go|rs|java)$/i.test(file)) ?? files[0]
  const taskId = github ? `github-${github.repository.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}` : 'demo-retry-318'
  const [trajectory, setTrajectory] = useState<AgentEventLog>(() => createEventLog(taskId))
  const executeDemo = async () => { try { const events = await streamAgentRun({ taskId, message: github ? `Inspect the read-only GitHub context for ${github.repository}.` : 'Inspect retry handling without editing code.', provider: undefined, approved: true }); setTrajectory(events.reduce((log, event) => appendEvent(log, event), createEventLog(taskId))) } catch { const result = await runDemoExecution(true); setTrajectory(result.log) } }

  return <main className="workspace"><aside className="repo-tree"><small>REPOSITORY</small><strong>{repository}</strong>{files.slice(0, 8).map((file, index) => <p className={file === selectedFile ? 'selected' : ''} key={file}><FileCode2 size={14} />{file}{index === 7 && files.length > 8 ? ' …' : ''}</p>)}</aside><section className="code-surface"><div className="surface-header"><span>{selectedFile}</span><span className="diff-tag">{github ? '只读' : '+2 −0'}</span></div>{github ? <div className="context-surface"><h2>只读 GitHub 上下文</h2><p>已读取文件树，但尚未请求任何文件正文。进入任务后，Agent 仍需在批准边界内使用只读工具读取具体文件。</p></div> : <><pre><code><i>01</i>export async function retryRequest(run, attempts = 3) {'\n'}<i>02</i>  for (let attempt = 0; attempt &lt; attempts; attempt += 1) {'\n'}<mark><i>03</i>    await wait(backoff(attempt))</mark>{'\n'}<mark><i>04</i>    try {'{'} return await run() {'}'}</mark>{'\n'}<i>05</i>  {'}'}</code></pre><div className="test-proof"><TestTube2 size={17} /><div><strong>Focused test passed</strong><span>retry.test.ts · 8 assertions · 0.42s</span></div><CheckCircle2 size={19} /></div></>}</section><aside className="agent-pane"><small>Agent trajectory</small><ol><li className="complete">探索项目约定</li><li className="complete">定位候选文件</li><li className="active">等待任务批准</li>{trajectory.events.map(event => <li key={event.id} className="complete">{event.summary}</li>)}{trajectory.events.length === 0 && <li>执行与验证</li>}</ol><TaskSpecPanel onApproved={executeDemo} /></aside></main>
}
