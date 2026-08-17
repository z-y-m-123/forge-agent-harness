const stages = ['意图', '探索', '批准', '执行', '验证', '审阅']
export function TaskStageBar({ active = 2 }: { active?: number }) { return <nav className="stage-bar" aria-label="任务阶段">{stages.map((stage, index) => <span className={index === active ? 'current' : index < active ? 'done' : ''} key={stage}><b>{String(index + 1).padStart(2, '0')}</b>{stage}</span>)}</nav> }
