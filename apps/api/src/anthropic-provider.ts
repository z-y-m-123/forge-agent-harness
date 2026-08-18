import type { AgentEventInput, RunRequest } from './contracts.js'
import type { ModelProvider } from './provider.js'

export interface AnthropicProviderOptions {
  id: string
  apiKey: string
  baseUrl: string
  model: string
  fetcher?: typeof fetch
}

export class AnthropicProvider implements ModelProvider {
  readonly id: string
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string
  private readonly fetcher: typeof fetch

  constructor(options: AnthropicProviderOptions) {
    this.id = options.id
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.model = options.model
    this.fetcher = options.fetcher ?? fetch
  }

  async *run(input: RunRequest): AsyncIterable<AgentEventInput> {
    const response = await this.fetcher(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: input.message }]
      })
    })

    if (!response.ok) throw new Error(`Provider request failed (${response.status})`)

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error('Provider response was not valid JSON')
    }
    const content = extractText(payload)
    if (!content) throw new Error('Provider response missing message content')
    yield { type: 'model.message', actor: 'coordinator', summary: content }
  }
}

function extractText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const content = (payload as { content?: unknown }).content
  if (!Array.isArray(content)) return null
  const text = content
    .filter(item => item && typeof item === 'object' && (item as { type?: unknown }).type === 'text')
    .map(item => (item as { text?: unknown }).text)
    .filter((item): item is string => typeof item === 'string')
    .join('')
    .trim()
  return text || null
}
