import { describe, expect, it, vi } from 'vitest'
import { streamAgentRun } from '../domain/agent-api'

describe('agent api client', () => {
  it('sends a run request and preserves NDJSON event order', async () => {
    const fetcher = vi.fn(async () => new Response([
      JSON.stringify({ type: 'model.message', actor: 'coordinator', summary: 'understood' }),
      JSON.stringify({ type: 'tool.completed', actor: 'explorer', tool: 'readFile', summary: 'readFile completed' })
    ].join('\n') + '\n', { status: 200, headers: { 'content-type': 'application/x-ndjson' } }))

    const events = await streamAgentRun({ taskId: 'task-1', message: 'inspect retries', provider: 'mock' }, fetcher)

    expect(fetcher).toHaveBeenCalledWith('/api/agent/runs', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ taskId: 'task-1', message: 'inspect retries', provider: 'mock' })
    }))
    expect(events.map(event => event.type)).toEqual(['model.message', 'tool.completed'])
  })

  it('throws the server error for a non-success response', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: 'Unknown provider: missing' }), { status: 404 }))

    await expect(streamAgentRun({ taskId: 'task-1', message: 'inspect', provider: 'missing' }, fetcher))
      .rejects.toThrow('Unknown provider: missing')
  })
})
