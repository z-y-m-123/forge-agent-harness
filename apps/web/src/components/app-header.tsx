import { Languages, ShieldCheck } from 'lucide-react'
import type { Locale } from '../domain/types'

export function AppHeader({ locale, onLocaleChange, projectName }: { locale: Locale; onLocaleChange: (locale: Locale) => void; projectName?: string }) {
  return <header className="app-header"><div className="brand-mark"><span className="brand-square" />Forge Agent</div><div className="header-context">{projectName && <span>{projectName}</span>}<span className="demo-label"><ShieldCheck size={14} />演示模式</span><div className="locale-switch"><Languages size={15} /><button className={locale === 'zh-CN' ? 'active' : ''} onClick={() => onLocaleChange('zh-CN')}>中文</button><button className={locale === 'en-US' ? 'active' : ''} onClick={() => onLocaleChange('en-US')}>English</button></div></div></header>
}
