import type { AgentEventInput } from './agent-events'

export interface AgentRunRequest {
  taskId: string
  message: string
  provider?: string
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function streamAgentRun(request: AgentRunRequest, fetcher: Fetcher = fetch): Promise<AgentEventInput[]> {
  const response = await fetcher('/api/agent/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const body = await response.text()
    let message = `Agent API request failed (${response.status})`
    try {
      const parsed: unknown = JSON.parse(body)
      if (parsed && typeof parsed === 'object' && typeof (parsed as { error?: unknown }).error === 'string') {
        message = (parsed as { error: string }).error
      }
    } catch {
      if (body.trim()) message = body.trim()
    }
    throw new Error(message)
  }

  const text = await response.text()
  return text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line) as AgentEventInput)
}
