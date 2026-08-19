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

async function requestWithOptions(path: string, init: RequestInit, allowedOrigins: string[] = []) {
  const server = createServer(new ProviderRegistry([new MockProvider()]), undefined, { allowedOrigins })
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind to a port')
  return fetch(`http://127.0.0.1:${address.port}${path}`, init)
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

  it('reports API health without model or GitHub credentials', async () => {
    const response = await requestWithOptions('/healthz', { method: 'GET' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })

  it('allows CORS preflight only for configured origins', async () => {
    const pagesOrigin = 'https://z-y-m-123.github.io'
    const allowed = await requestWithOptions('/api/agent/runs', { method: 'OPTIONS', headers: { origin: pagesOrigin } }, [pagesOrigin])
    const blocked = await requestWithOptions('/api/agent/runs', { method: 'OPTIONS', headers: { origin: 'https://untrusted.example' } }, [pagesOrigin])

    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('access-control-allow-origin')).toBe(pagesOrigin)
    expect(blocked.status).toBe(403)
    expect(blocked.headers.get('access-control-allow-origin')).toBeNull()
  })
})
