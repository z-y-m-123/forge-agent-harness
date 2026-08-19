import { describe, expect, it, vi } from 'vitest'
import { loadGitHubContext, loadGitHubFile, loadGitHubFiles } from '../domain/github-api'

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

  it('requests a specific GitHub file without sending credentials', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ repository: 'acme/api-service', path: 'src/index.ts', content: 'export const api = true\n', sha: 'file-sha' }), { status: 200 }))

    await expect(loadGitHubFile('acme/api-service', 'src/index.ts', fetcher)).resolves.toMatchObject({ content: 'export const api = true\n' })
    expect(fetcher).toHaveBeenCalledWith('/api/github/file', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ repository: 'acme/api-service', path: 'src/index.ts' })
    }))
  })

  it('requests selected GitHub files as one read-only batch', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([{ repository: 'acme/api-service', path: 'src/a.ts', content: '// a\n' }]), { status: 200 }))

    await expect(loadGitHubFiles('acme/api-service', ['src/a.ts'], fetcher)).resolves.toEqual([{ repository: 'acme/api-service', path: 'src/a.ts', content: '// a\n' }])
    expect(fetcher).toHaveBeenCalledWith('/api/github/files', expect.objectContaining({ method: 'POST', body: JSON.stringify({ repository: 'acme/api-service', paths: ['src/a.ts'] }) }))
  })
})
