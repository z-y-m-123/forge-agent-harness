import { Languages, Settings2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { Locale } from '../domain/types'
import { isApiConfigured } from '../domain/api-url'
import { ProviderConnectionPanel } from './provider-connection-panel'

export function AppHeader({ locale, onLocaleChange, projectName }: { locale: Locale; onLocaleChange: (locale: Locale) => void; projectName?: string }) {
  const [open, setOpen] = useState(false)
  return <><header className="app-header"><div className="brand-mark"><span className="brand-square" />Forge Agent</div><div className="header-context">{projectName && <span>{projectName}</span>}<button className="connection-trigger" onClick={() => setOpen(true)}><Settings2 size={15} />模型连接</button><span className="demo-label"><ShieldCheck size={14} />{isApiConfigured ? 'BYOK 会话' : 'Mock 演示'}</span><div className="locale-switch"><Languages size={15} /><button className={locale === 'zh-CN' ? 'active' : ''} onClick={() => onLocaleChange('zh-CN')}>中文</button><button className={locale === 'en-US' ? 'active' : ''} onClick={() => onLocaleChange('en-US')}>English</button></div></div></header>{open && <ProviderConnectionPanel onClose={() => setOpen(false)} />}</>
}
