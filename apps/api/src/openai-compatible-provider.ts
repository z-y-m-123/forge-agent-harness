import type { AgentEventInput, RunRequest } from './contracts.js'
import type { ModelProvider } from './provider.js'

export interface OpenAICompatibleProviderOptions {
  id: string
  apiKey: string
  baseUrl: string
  model: string
  fetcher?: typeof fetch
}

export class OpenAICompatibleProvider implements ModelProvider {
  readonly id: string
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly model: string
  private readonly fetcher: typeof fetch

  constructor(options: OpenAICompatibleProviderOptions) {
    this.id = options.id
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.model = options.model
    this.fetcher = options.fetcher ?? fetch
  }

  async *run(input: RunRequest): AsyncIterable<AgentEventInput> {
    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: input.message }]
      })
    })

    if (!response.ok) throw new Error(`Provider request failed (${response.status})`)

    const payload: unknown = await response.json()
    const content = extractContent(payload)
    if (!content) throw new Error('Provider response missing message content')
    yield { type: 'model.message', actor: 'coordinator', summary: content }
  }
}

function extractContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const choices = (payload as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0 || !choices[0] || typeof choices[0] !== 'object') return null
  const message = (choices[0] as { message?: unknown }).message
  if (!message || typeof message !== 'object') return null
  const content = (message as { content?: unknown }).content
  return typeof content === 'string' && content.trim() ? content : null
}
