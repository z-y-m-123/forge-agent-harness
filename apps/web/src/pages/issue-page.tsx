import { CheckCircle2, Clock3, GitPullRequest, ShieldAlert } from 'lucide-react'
import { useApp } from '../app'

const demoIssue = { number: 318, repository: 'acme/api-service', title: '请求重试在超时后丢失追踪上下文', summary: '把超时重试限制在 GET 请求，且保留原始 trace ID。' }

export function IssuePage() {
  const { state } = useApp()
  const github = state.githubContext
  const issue = github?.issues[0]
  const selected = issue ? { number: issue.number, repository: github.repository, title: issue.title, summary: '该 Issue 来自 GitHub 只读上下文。任务范围和验收证据必须在批准前由 Agent 与用户共同确认。' } : demoIssue
  const readme = github?.readme.split('\n').map(line => line.trim()).find(line => line && !line.startsWith('#'))
  return <main className="issue-page"><section className="issue-main"><p className="eyebrow">ISSUE #{selected.number} · {selected.repository}</p><h1>{selected.title}</h1><p className="lead">{selected.summary}</p><div className="timeline"><div><Clock3 size={17} /><span>探索</span><strong>{github ? `${github.files.length} 个文件可供只读探索` : '识别 3 个调用点'}</strong></div><div><CheckCircle2 size={17} /><span>规格</span><strong>任务边界待生成</strong></div><div><Clock3 size={17} /><span>执行</span><strong>等待用户批准</strong></div></div></section><section className="evidence-board"><h2>Delivery evidence</h2>{github ? <><article><b>GitHub 事实</b><p>{readme || 'README 暂无可用摘要'}</p></article><article><b>已读取范围</b><p>{github.files.slice(0, 4).join(' · ') || '文件树为空'}</p></article><article><b>约束</b><p>当前只读取仓库上下文，不修改分支、文件或 Issue。</p></article></> : <><article><b>范围</b><p>只涉及 retry 与 HTTP client 测试。</p></article><article><b>回归覆盖</b><p>超时、GET 限制、trace ID 三类断言。</p></article><article><b>验证</b><p>测试命令和 Git diff 将在执行后显示。</p></article></>}<article className="risk"><ShieldAlert size={17} /><div><b>残余风险</b><p>未读取文件正文前，不能推断实现位置或修改方案。</p></div></article><button className="button disabled" disabled><GitPullRequest size={16} />只读模式：不创建 PR</button></section></main>
}
