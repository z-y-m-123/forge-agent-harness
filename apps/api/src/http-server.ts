import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { ProviderRegistry } from './provider-registry.js'
import { createConfiguredRegistry } from './runtime-config.js'
import { createProviderFromConnection } from './runtime-config.js'
import { runAgentLoop } from './agent-loop.js'
import { GitHubClient, type GitHubContext, type GitHubFile } from './github-client.js'
import type { ProviderConnection, RunRequest } from './contracts.js'

const MAX_BODY_BYTES = 1024 * 1024

function writeError(response: ServerResponse, status: number, message: string) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify({ error: message }))
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw new Error('Request body too large')
    chunks.push(buffer)
  }

  return Buffer.concat(chunks).toString('utf8')
}

function parseRunRequest(body: string): RunRequest {
  const parsed: unknown = JSON.parse(body)
  if (!parsed || typeof parsed !== 'object') throw new Error('Request body must be a JSON object')

  const candidate = parsed as Record<string, unknown>
  if (typeof candidate.taskId !== 'string' || candidate.taskId.trim() === '') throw new Error('taskId is required')
  if (typeof candidate.message !== 'string' || candidate.message.trim() === '') throw new Error('message is required')
  if (candidate.provider !== undefined && typeof candidate.provider !== 'string') throw new Error('provider must be a string')
  if (candidate.approved !== undefined && typeof candidate.approved !== 'boolean') throw new Error('approved must be a boolean')

  let connection: ProviderConnection | undefined
  if (candidate.connection !== undefined) {
    if (!candidate.connection || typeof candidate.connection !== 'object') throw new Error('connection must be an object')
    const value = candidate.connection as Record<string, unknown>
    if (value.provider !== 'openai-compatible' && value.provider !== 'anthropic' && value.provider !== 'mock') throw new Error('connection provider is invalid')
    for (const field of ['apiKey', 'baseUrl', 'model']) {
      if (value[field] !== undefined && typeof value[field] !== 'string') throw new Error(`connection ${field} must be a string`)
    }
    const apiKey = typeof value.apiKey === 'string' ? value.apiKey.trim() : undefined
    const baseUrl = typeof value.baseUrl === 'string' ? value.baseUrl.trim() : undefined
    const model = typeof value.model === 'string' ? value.model.trim() : undefined
    if (apiKey && apiKey.length > 4096) throw new Error('apiKey is too long')
    if (baseUrl) {
      if (baseUrl.length > 2048) throw new Error('baseUrl is too long')
      let parsedUrl: URL
      try { parsedUrl = new URL(baseUrl) } catch { throw new Error('baseUrl must be a valid URL') }
      if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') throw new Error('baseUrl must use HTTPS')
    }
    if (model && model.length > 200) throw new Error('model is too long')
    connection = { provider: value.provider, ...(apiKey ? { apiKey } : {}), ...(baseUrl ? { baseUrl } : {}), ...(model ? { model } : {}) }
  }

  return {
    taskId: candidate.taskId,
    message: candidate.message,
    provider: typeof candidate.provider === 'string' && candidate.provider.trim() ? candidate.provider : undefined,
    approved: candidate.approved === true,
    connection
  }
}

type GitHubReadOnlyClient = Pick<GitHubClient, 'getContext'> & Partial<Pick<GitHubClient, 'getFile' | 'getFiles'>>

export function createServer(registry: ProviderRegistry, githubClient: GitHubReadOnlyClient = new GitHubClient()): Server {
  return createHttpServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/api/github/context') {
      try {
        const body = JSON.parse(await readBody(request)) as { repository?: unknown }
        if (typeof body.repository !== 'string' || !body.repository.trim()) throw new Error('repository is required')
        const context: GitHubContext = await githubClient.getContext(body.repository)
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify(context))
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'GitHub request failed'
        writeError(response, message.includes('required') || message.includes('format') ? 400 : 502, message)
      }
      return
    }

    if (request.method === 'POST' && request.url === '/api/github/file') {
      try {
        const body = JSON.parse(await readBody(request)) as { repository?: unknown; path?: unknown }
        if (typeof body.repository !== 'string' || !body.repository.trim()) throw new Error('repository is required')
        if (typeof body.path !== 'string' || !body.path.trim()) throw new Error('path is required')
        if (!githubClient.getFile) throw new Error('GitHub file reading is unavailable')
        const file: GitHubFile = await githubClient.getFile(body.repository, body.path)
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify(file))
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : ''
        const isInputError = message.includes('required') || message.includes('format') || message.includes('safe repository-relative path')
        writeError(response, isInputError ? 400 : 502, isInputError ? message : 'Unable to read GitHub file')
      }
      return
    }

    if (request.method === 'POST' && request.url === '/api/github/files') {
      try {
        const body = JSON.parse(await readBody(request)) as { repository?: unknown; paths?: unknown }
        if (typeof body.repository !== 'string' || !body.repository.trim()) throw new Error('repository is required')
        if (!Array.isArray(body.paths) || body.paths.length === 0 || body.paths.some(path => typeof path !== 'string' || !path.trim())) throw new Error('paths must contain at least one file path')
        if (!githubClient.getFiles) throw new Error('GitHub batch file reading is unavailable')
        const files = await githubClient.getFiles(body.repository, body.paths)
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify(files))
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : ''
        const isInputError = message.includes('required') || message.includes('must contain') || message.includes('format') || message.includes('safe repository-relative path') || message.includes('maximum')
        writeError(response, isInputError ? 400 : 502, isInputError ? message : 'Unable to read selected GitHub files')
      }
      return
    }

    if (request.method !== 'POST' || request.url !== '/api/agent/runs') {
      writeError(response, 404, 'Not found')
      return
    }

    let input: RunRequest
    try {
      input = parseRunRequest(await readBody(request))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Invalid request'
      writeError(response, message === 'Request body too large' ? 413 : 400, message)
      return
    }

    let provider
    try {
      provider = input.connection ? createProviderFromConnection(input.connection) : registry.get(input.provider)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown provider'
      writeError(response, message.includes('apiKey') ? 400 : 404, message)
      return
    }

    response.writeHead(200, {
      'cache-control': 'no-cache',
      'content-type': 'application/x-ndjson; charset=utf-8'
    })

    try {
      for await (const event of runAgentLoop(provider, input)) response.write(`${JSON.stringify(event)}\n`)
    } catch {
      response.write(`${JSON.stringify({ type: 'provider.failed', actor: 'coordinator', summary: 'Provider request failed' })}\n`)
    } finally {
      response.end()
    }
  })
}

export function startServer(port = Number(process.env.PORT ?? 8787), host = '127.0.0.1') {
  const server = createServer(createConfiguredRegistry(), new GitHubClient({ token: process.env.GITHUB_TOKEN, baseUrl: process.env.GITHUB_API_BASE_URL }))
  server.listen(port, host, () => console.log(`Forge API listening on http://${host}:${port}`))
  return server
}
