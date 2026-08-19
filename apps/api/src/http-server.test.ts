import { afterEach, describe, expect, it } from 'vitest'
import { createServer } from './http-server.js'
import { MockProvider } from './mock-provider.js'
import { ProviderRegistry } from './provider-registry.js'
import type { Server } from 'node:http'

const servers: Server[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))))
})

async function request(body: string, provider = new ProviderRegistry([new MockProvider()])) {
  const server = createServer(provider)
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind to a port')

  const response = await fetch(`http://127.0.0.1:${address.port}/api/agent/runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body
  })
  return { response, text: await response.text() }
}

describe('agent run HTTP endpoint', () => {
  it('returns 400 for malformed JSON and missing messages', async () => {
    const malformed = await request('{')
    const missingMessage = await request(JSON.stringify({ taskId: 'task-1' }))

    expect(malformed.response.status).toBe(400)
    expect(missingMessage.response.status).toBe(400)
  })

  it('returns 404 for an unknown provider', async () => {
    const result = await request(JSON.stringify({ taskId: 'task-1', message: 'inspect', provider: 'missing' }))

    expect(result.response.status).toBe(404)
  })

  it('accepts a per-request mock connection without using the server registry', async () => {
    const result = await request(JSON.stringify({ taskId: 'task-1', message: 'inspect', provider: 'missing', connection: { provider: 'mock' } }))
    expect(result.response.status).toBe(200)
    expect(result.text).toContain('Mock provider understood: inspect')
  })

  it('rejects a BYOK connection without an API key', async () => {
    const result = await request(JSON.stringify({ taskId: 'task-1', message: 'inspect', connection: { provider: 'openai-compatible' } }))
    expect(result.response.status).toBe(400)
    expect(result.text).toContain('apiKey is required')
  })

  it('rejects insecure external BYOK base URLs', async () => {
    const result = await request(JSON.stringify({ taskId: 'task-1', message: 'inspect', connection: { provider: 'openai-compatible', apiKey: 'key', baseUrl: 'http://example.com/v1' } }))
    expect(result.response.status).toBe(400)
    expect(result.text).toContain('baseUrl must use HTTPS')
  })

  it('streams ordered events as newline-delimited JSON', async () => {
    const result = await request(JSON.stringify({ taskId: 'task-1', message: 'inspect retries' }))

    expect(result.response.status).toBe(200)
    expect(result.response.headers.get('content-type')).toContain('application/x-ndjson')
    expect(result.text.trim().split('\n').map(line => JSON.parse(line).type)).toEqual([
      'model.message',
      'task.spec',
      'tool.requested'
    ])
  })

  it('executes the requested read-only tool only when approved', async () => {
    const result = await request(JSON.stringify({ taskId: 'task-1', message: 'inspect retries', approved: true }))

    expect(result.text.trim().split('\n').map(line => JSON.parse(line).type)).toEqual([
      'model.message',
      'task.spec',
      'tool.requested',
      'tool.started',
      'tool.completed'
    ])
  })

  it('emits a sanitized provider failure event when an upstream call fails', async () => {
    const failingProvider = {
      id: 'failing',
      async *run() {
        throw new Error('upstream secret')
      }
    }
    const result = await request(
      JSON.stringify({ taskId: 'task-1', message: 'inspect', provider: 'failing' }),
      new ProviderRegistry([failingProvider])
    )

    expect(result.response.status).toBe(200)
    expect(result.text).toContain('provider.failed')
    expect(result.text).not.toContain('upstream secret')
  })
})
