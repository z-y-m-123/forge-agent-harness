import { CheckCircle2, FileCode2, LoaderCircle, RotateCcw, TestTube2 } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../app'
import { TaskSpecPanel } from '../components/task-spec-panel'
import { streamAgentRun } from '../domain/agent-api'
import { appendEvent, createEventLog, type AgentEventLog } from '../domain/agent-events'
import { runDemoExecution } from '../domain/demo-execution'
import { loadGitHubFile, loadGitHubFiles, type GitHubFile } from '../domain/github-api'
import { MAX_GITHUB_SELECTION_LIMIT, summarizeGitHubFiles, type GitHubProjectSummary } from '../domain/github-summary'

const demoFiles = ['src/http/retry.ts', 'src/http/retry.test.ts', 'tests']

export function WorkspacePage() {
  const { state, dispatch } = useApp()
  const github = state.githubContext
  const repository = github?.repository ?? 'acme/api-service'
  const files = github?.files.length ? github.files : demoFiles
  const firstFile = files.find(file => /\.(ts|tsx|js|jsx|py|go|rs|java)$/i.test(file)) ?? files[0]
  const [selectedFile, setSelectedFile] = useState(firstFile)
  const [loadedFile, setLoadedFile] = useState<GitHubFile>()
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [fileError, setFileError] = useState('')
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [batchFiles, setBatchFiles] = useState<GitHubFile[]>([])
  const [batchStatus, setBatchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [batchError, setBatchError] = useState('')
  const taskId = github ? `github-${github.repository.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}` : 'demo-retry-318'
  const [trajectory, setTrajectory] = useState<AgentEventLog>(() => createEventLog(taskId))
  const projectSummary: GitHubProjectSummary | undefined = batchFiles.length ? summarizeGitHubFiles(batchFiles) : undefined

  const executeDemo = async () => {
    try {
      const events = await streamAgentRun({ taskId, message: github ? `Inspect the read-only GitHub context for ${github.repository}.` : 'Inspect retry handling without editing code.', provider: undefined, approved: true, connection: state.connection })
      setTrajectory(events.reduce((log, event) => appendEvent(log, event), createEventLog(taskId)))
    } catch {
      const result = await runDemoExecution(true)
      setTrajectory(result.log)
    }
  }

  const readFile = async (file: string) => {
    setSelectedFile(file)
    if (!github) return
    setFileStatus('loading')
    setFileError('')
    setLoadedFile(undefined)
    try {
      const loaded = await loadGitHubFile(github.repository, file)
      setLoadedFile(loaded)
      dispatch({ type: 'githubFileRead', evidence: { repository: loaded.repository, path: loaded.path, ...(loaded.sha ? { sha: loaded.sha } : {}), readAt: new Date().toISOString() } })
      setFileStatus('idle')
    } catch (cause) {
      setFileStatus('error')
      setFileError(cause instanceof Error ? cause.message : '无法读取 GitHub 文件')
    }
  }

  const togglePath = (path: string) => setSelectedPaths(current => current.includes(path) ? current.filter(item => item !== path) : current.length >= MAX_GITHUB_SELECTION_LIMIT ? current : [...current, path])

  const readSelectedFiles = async () => {
    if (!github || selectedPaths.length === 0) return
    setBatchStatus('loading')
    setBatchError('')
    try {
      const loaded = await loadGitHubFiles(github.repository, selectedPaths)
      setBatchFiles(loaded)
      loaded.forEach(file => dispatch({ type: 'githubFileRead', evidence: { repository: file.repository, path: file.path, ...(file.sha ? { sha: file.sha } : {}), readAt: new Date().toISOString() } }))
      setBatchStatus('idle')
    } catch (cause) {
      setBatchStatus('error')
      setBatchError(cause instanceof Error ? cause.message : '无法读取已选 GitHub 文件')
    }
  }

  return <main className="workspace">
    <aside className="repo-tree">
      <small>REPOSITORY</small>
      <strong>{repository}</strong>
      {files.slice(0, 8).map((file, index) => <div className="tree-row" key={file}><input type="checkbox" aria-label={`选择 ${file}`} checked={selectedPaths.includes(file)} onChange={() => togglePath(file)} /><button className={`tree-file ${file === selectedFile ? 'selected' : ''}`} type="button" onClick={() => void readFile(file)}>
        <FileCode2 size={14} />{file}{index === 7 && files.length > 8 ? ' ...' : ''}
      </button></div>)}
      {github && <><button className="button primary batch-read" type="button" disabled={selectedPaths.length === 0 || batchStatus === 'loading'} onClick={() => void readSelectedFiles()}>{batchStatus === 'loading' ? '读取中...' : `读取已选文件（${selectedPaths.length}）`}</button>{batchStatus === 'error' && <p className="batch-error" role="alert">{batchError}</p>}</>}
    </aside>
    <section className="code-surface">
      <div className="surface-header"><span>{selectedFile}</span><span className="diff-tag">{github ? '只读' : '+2 −0'}</span></div>
      {github ? <div className="context-surface">
        {projectSummary && <section className="project-summary"><p className="fact-label">GitHub 事实 · 项目摘要</p><h2>项目摘要</h2><p>{projectSummary.overview}</p>{projectSummary.files.map(file => <p className="summary-file" key={file.path}>{file.path} · {file.bytes} 字节 · {file.lines} 行{file.chunks > 1 ? ` · ${file.chunks} 个分块` : ''}</p>)}</section>}
        {fileStatus === 'loading' ? <><LoaderCircle className="spin" size={18} /><h2>正在读取 GitHub 文件</h2><p>只读取 {selectedFile} 的当前正文，不运行测试，也不写入仓库。</p></> : loadedFile ? <><p className="fact-label">GitHub 事实 · 已读取文件正文</p><h2>{loadedFile.path}</h2><pre><code>{loadedFile.content}</code></pre>{loadedFile.sha && <p className="file-sha">GitHub blob · {loadedFile.sha}</p>}</> : fileStatus === 'error' ? <><h2>无法读取该文件</h2><p role="alert">{fileError}</p><button className="button quiet" type="button" onClick={() => void readFile(selectedFile)}><RotateCcw size={16} />重试读取</button></> : <><h2>只读 GitHub 上下文</h2><p>已读取文件树。选择左侧文件可读取正文；勾选多个文件后可生成项目摘要。此操作不会运行测试、生成 diff 或写入仓库。</p></>}
      </div> : <>
        <pre><code><i>01</i>export async function retryRequest(run, attempts = 3) {'\n'}<i>02</i>  for (let attempt = 0; attempt &lt; attempts; attempt += 1) {'\n'}<mark><i>03</i>    await wait(backoff(attempt))</mark>{'\n'}<mark><i>04</i>    try {'{'} return await run() {'}'}</mark>{'\n'}<i>05</i>  {'}'}</code></pre>
        <div className="test-proof"><TestTube2 size={17} /><div><strong>Focused test passed</strong><span>retry.test.ts · 8 assertions · 0.42s</span></div><CheckCircle2 size={19} /></div>
      </>}
    </section>
    <aside className="agent-pane"><small>Agent trajectory</small><ol><li className="complete">探索项目约定</li><li className="complete">定位候选文件</li>{state.githubReadEvidence.map(evidence => <li className="complete" key={`${evidence.repository}/${evidence.path}/${evidence.readAt}`}>已读取 GitHub 文件：{evidence.path}</li>)}<li className="active">等待任务批准</li>{trajectory.events.map(event => <li key={event.id} className="complete">{event.summary}</li>)}{trajectory.events.length === 0 && <li>执行与验证</li>}</ol><TaskSpecPanel onApproved={executeDemo} /></aside>
  </main>
}
