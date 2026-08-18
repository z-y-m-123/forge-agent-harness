import { describe, expect, it, vi } from 'vitest'
import { OpenAICompatibleProvider } from './openai-compatible-provider.js'

async function collect(provider: OpenAICompatibleProvider) {
  const events = []
  for await (const event of provider.run({ taskId: 'task-1', message: 'explain retry' })) events.push(event)
  return events
}

describe('OpenAI-compatible provider', () => {
  it('sends a bearer-authenticated chat request and maps the response to a model event', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'Retry uses exponential backoff.' } }]
    }), { status: 200 }))
    const provider = new OpenAICompatibleProvider({
      id: 'deepseek',
      apiKey: 'server-secret',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      fetcher
    })

    const events = await collect(provider)
    const [url, init] = fetcher.mock.calls[0]

    expect(url).toBe('https://api.deepseek.com/v1/chat/completions')
    expect(init?.headers).toEqual({
      authorization: 'Bearer server-secret',
      'content-type': 'application/json'
    })
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'explain retry' }]
    })
    expect(events).toEqual([{ type: 'model.message', actor: 'coordinator', summary: 'Retry uses exponential backoff.' }])
  })

  it('sanitizes provider failures instead of exposing response bodies', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response('secret provider diagnostics', { status: 401 }))
    const provider = new OpenAICompatibleProvider({
      id: 'openai-compatible',
      apiKey: 'server-secret',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      fetcher
    })

    await expect(collect(provider)).rejects.toThrow('Provider request failed (401)')
    await expect(collect(provider)).rejects.not.toThrow('secret provider diagnostics')
  })
})
