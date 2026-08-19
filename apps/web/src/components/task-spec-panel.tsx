import { AlertTriangle, Check, FileCode2, LockKeyhole } from 'lucide-react'
import { useEffect } from 'react'
import { useApp } from '../app'
import { TaskStageBar } from './task-stage-bar'

export function TaskSpecPanel({ onApproved }: { onApproved?: () => void } = {}) {
  const { state, dispatch } = useApp()
  useEffect(() => { if (state.taskStatus === 'idle') dispatch({ type: 'taskProposed' }) }, [state.taskStatus, dispatch])
  const approved = state.taskStatus === 'approved' || state.taskStatus === 'executing'
  const github = state.githubContext
  const candidateFiles = github?.files.slice(0, 3) ?? ['src/http/retry.ts', 'src/http/retry.test.ts']
  const approve = () => { dispatch({ type: 'taskApproved' }); onApproved?.() }

  return <section className="task-panel">
    <TaskStageBar active={approved ? 3 : 2} />
    <div className="panel-heading"><div><small>任务说明 · Task Spec</small><h2>{approved ? '执行计划' : '请先确认任务边界'}</h2></div><span className={approved ? 'status verified' : 'status pending'}>{approved ? '已批准' : '需要你的批准'}</span></div>
    <div className="spec-grid">
      <div><label>目标结果</label><p>{github ? `先探索 ${github.repository} 的已读取上下文，再由用户确认具体改动目标。` : '为 API 服务补充请求重试策略，并保留现有错误语义。'}</p><label>{github ? '候选范围' : '范围内文件'}</label><p className="file-line">{candidateFiles.map(file => <span key={file}><FileCode2 size={16} />{file}<br /></span>)}</p></div>
      <div><label>验收证据</label>{github ? <><p className="evidence-heading">已读取文件证据</p>{state.githubReadEvidence.length ? <ul className="evidence-list github-evidence">{state.githubReadEvidence.map(evidence => <li key={`${evidence.repository}/${evidence.path}/${evidence.readAt}`}><Check size={15} /><span>{evidence.path}{evidence.sha && <small> · SHA {evidence.sha}</small>}</span></li>)}</ul> : <p className="evidence-empty">尚未读取文件正文</p>}<ul className="evidence-list"><li><Check size={15} />具体文件范围由用户确认</li><li><Check size={15} />任何 diff 均可逐行审阅</li></ul></> : <ul className="evidence-list"><li><Check size={15} />现有测试全部通过</li><li><Check size={15} />新增退避边界测试</li><li><Check size={15} />Git diff 可逐行审阅</li></ul>}<div className="boundary"><LockKeyhole size={16} /><span><strong>不改代码</strong><br />在你批准前，Agent 只会探索和生成说明。</span></div></div>
    </div>
    {!approved && <div className="panel-actions"><button className="button primary" onClick={approve}>批准任务并创建计划</button><button className="button quiet" onClick={() => dispatch({ type: 'scopeAmendmentRequested' })}><AlertTriangle size={16} />请求扩大范围</button></div>}
  </section>
}
