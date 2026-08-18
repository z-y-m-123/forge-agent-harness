import { describe, expect, it, vi } from 'vitest'
import { AnthropicProvider } from './anthropic-provider.js'

async function collect(provider: AnthropicProvider) {
  const events = []
  for await (const event of provider.run({ taskId: 'task-1', message: 'explain retry' })) events.push(event)
  return events
}

describe('Anthropic provider', () => {
  it('sends a Messages API request and maps text content to a model event', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      content: [{ type: 'text', text: 'Retry uses exponential backoff.' }]
    }), { status: 200 }))
    const provider = new AnthropicProvider({
      id: 'anthropic',
      apiKey: 'server-secret',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-5-sonnet-latest',
      fetcher
    })

    const events = await collect(provider)
    const [url, init] = fetcher.mock.calls[0]

    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init?.headers).toEqual({
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': 'server-secret'
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'explain retry' }]
    })
    expect(events).toEqual([{ type: 'model.message', actor: 'coordinator', summary: 'Retry uses exponential backoff.' }])
  })

  it('rejects malformed text responses without exposing response details', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('secret diagnostics', { status: 200 }))
    const provider = new AnthropicProvider({
      id: 'anthropic',
      apiKey: 'server-secret',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-5-sonnet-latest',
      fetcher
    })

    await expect(collect(provider)).rejects.toThrow('Provider response was not valid JSON')
    await expect(collect(provider)).rejects.not.toThrow('secret diagnostics')
  })
})
