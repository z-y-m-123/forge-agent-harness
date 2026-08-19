import { afterEach, describe, expect, it } from 'vitest'
import { createServer } from './http-server.js'
import { GitHubClient } from './github-client.js'
import { MockProvider } from './mock-provider.js'
import { ProviderRegistry } from './provider-registry.js'
import type { Server } from 'node:http'

const servers: Server[] = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))))
})

it('returns read-only GitHub context as JSON', async () => {
  const github = { getContext: async () => ({ repository: 'acme/api-service', description: 'API', defaultBranch: 'main', readme: '# API', files: ['src/index.ts'], issues: [] }) }
  const server = createServer(new ProviderRegistry([new MockProvider()]), github)
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind')

  const response = await fetch(`http://127.0.0.1:${address.port}/api/github/context`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ repository: 'acme/api-service' })
  })

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(await response.json()).toMatchObject({ repository: 'acme/api-service', files: ['src/index.ts'] })
})

it('returns a requested GitHub file as read-only evidence', async () => {
  const github = {
    getContext: async () => ({ repository: 'acme/api-service', description: 'API', defaultBranch: 'main', readme: '# API', files: ['src/index.ts'], issues: [] }),
    getFile: async (repository: string, path: string) => ({ repository, path, content: 'export const api = true\n', sha: 'file-sha' })
  }
  const server = createServer(new ProviderRegistry([new MockProvider()]), github)
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Test server did not bind')

  const response = await fetch(`http://127.0.0.1:${address.port}/api/github/file`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ repository: 'acme/api-service', path: 'src/index.ts' })
  })

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ repository: 'acme/api-service', path: 'src/index.ts', content: 'export const api = true\n', sha: 'file-sha' })
})
