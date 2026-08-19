import { describe, expect, it, vi } from 'vitest'
import { loadGitHubContext } from '../domain/github-api'

describe('GitHub context client', () => {
  it('sends only the repository name and parses the read-only context', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ repository: 'acme/api-service', files: [], issues: [] }), { status: 200 }))
    const context = await loadGitHubContext('acme/api-service', fetcher)

    expect(fetcher).toHaveBeenCalledWith('/api/github/context', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ repository: 'acme/api-service' })
    }))
    expect(context.repository).toBe('acme/api-service')
  })

  it('surfaces sanitized server errors', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ error: 'Repository must use owner/name format' }), { status: 400 }))

    await expect(loadGitHubContext('invalid', fetcher)).rejects.toThrow('Repository must use owner/name format')
  })
})
