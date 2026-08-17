import { ArrowUpRight } from 'lucide-react'
import { ModeSelector } from '../components/mode-selector'
import { ProjectPicker } from '../components/project-picker'
import { demoProjects } from '../domain/demo-data'
import { useApp } from '../app'

export function HomePage() { const { state, dispatch } = useApp(); const selected = demoProjects.find(item => item.id === state.projectId); return <main className="home-page"><section className="intro"><p className="eyebrow">PROJECT-AWARE CODING AGENT</p><h1>{selected ? '今天要怎么工作？' : '选择一个项目'}</h1><p>{selected ? `已连接 ${selected.name}。选择一种工作方式，所有执行都将以明确的任务合同为起点。` : 'Forge Agent 会先建立项目上下文，再把你的意图变成可审阅、可验证的交付。'}</p></section>{selected ? <><ModeSelector onSelect={mode => dispatch({ type: 'modeSelected', mode })} /><button className="back-link" onClick={() => dispatch({ type: 'projectSelected', projectId: '' })}>← 更换项目</button></> : <ProjectPicker projects={demoProjects} onSelect={projectId => dispatch({ type: 'projectSelected', projectId })} />}<aside className="principle-strip"><span>01 先理解项目</span><span>02 明确责任边界</span><span>03 用证据交付</span><ArrowUpRight size={18} /></aside></main> }
