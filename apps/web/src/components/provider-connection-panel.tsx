import { KeyRound, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../app'
import type { ProviderConnection, ProviderConnectionKind } from '../domain/types'
import { isApiConfigured } from '../domain/api-url'

const defaults: Record<ProviderConnectionKind, Pick<ProviderConnection, 'baseUrl' | 'model'>> = {
  'openai-compatible': { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  anthropic: { baseUrl: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-latest' },
  mock: { baseUrl: '', model: '' }
}

export function ProviderConnectionPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp()
  const existing = state.connection
  const [provider, setProvider] = useState<ProviderConnectionKind>(existing?.provider ?? 'openai-compatible')
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '')
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl ?? defaults['openai-compatible'].baseUrl)
  const [model, setModel] = useState(existing?.model ?? defaults['openai-compatible'].model)
  const chooseProvider = (value: ProviderConnectionKind) => { setProvider(value); setBaseUrl(defaults[value].baseUrl); setModel(defaults[value].model); if (value === 'mock') setApiKey('') }
  const save = () => { if (provider !== 'mock' && !apiKey.trim()) return; dispatch({ type: 'connectionChanged', connection: { provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() } }); onClose() }
  return <div className="connection-overlay" role="dialog" aria-modal="true" aria-labelledby="connection-title"><section className="connection-panel"><header><div><p className="eyebrow">BYOK · BRING YOUR OWN KEY</p><h2 id="connection-title">连接模型服务</h2></div><button className="icon-button" aria-label="关闭连接设置" onClick={onClose}><X size={18} /></button></header><p className="connection-note"><ShieldCheck size={16} />{isApiConfigured ? '密钥只保存在当前浏览器会话内存，关闭页面或点击清除后立即失效，不写入 URL、localStorage 或日志。' : '当前是 GitHub Pages 静态演示，未配置 API 服务。请选择 Mock；真实 Key 不会被提交或保存。'}</p><label>服务类型<select value={provider} onChange={event => chooseProvider(event.target.value as ProviderConnectionKind)}><option value="openai-compatible" disabled={!isApiConfigured}>OpenAI 兼容接口（OpenAI / DeepSeek / 通义 / 智谱）</option><option value="anthropic" disabled={!isApiConfigured}>Anthropic</option><option value="mock">Mock 演示（无需 Key）</option></select></label>{provider !== 'mock' && <label>API Key<input type="password" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder="sk-..." autoComplete="off" /></label>}{provider !== 'mock' && <label>API Base URL<input value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="https://api.example.com/v1" autoComplete="off" /></label>}{provider !== 'mock' && <label>模型名称<input value={model} onChange={event => setModel(event.target.value)} placeholder="模型 ID" autoComplete="off" /></label>}<footer><button className="button quiet" onClick={() => { dispatch({ type: 'connectionChanged' }); onClose() }}>清除当前 Key</button><button className="button primary" disabled={provider !== 'mock' && (!apiKey.trim() || !isApiConfigured)} onClick={save}><KeyRound size={16} />保存到本次会话</button></footer></section></div>
}
