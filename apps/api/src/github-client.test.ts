import { describe, expect, it, vi } from 'vitest'
import { GitHubClient } from './github-client.js'

describe('GitHub read-only client', () => {
  it('loads repository context with server-side auth and decodes README content', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input)
      if (url.endsWith('/repos/acme/api-service')) return new Response(JSON.stringify({ full_name: 'acme/api-service', description: 'API', default_branch: 'main' }))
      if (url.endsWith('/readme')) return new Response(JSON.stringify({ content: Buffer.from('# API\n').toString('base64'), encoding: 'base64' }))
      if (url.includes('/git/trees/main')) return new Response(JSON.stringify({ tree: [{ path: 'src/http/retry.ts', type: 'blob' }] }))
      return new Response(JSON.stringify([{ number: 7, title: 'Retry context', state: 'open' }]))
    })
    const client = new GitHubClient({ token: 'server-secret', fetcher })

    const context = await client.getContext('acme/api-service')

    expect(context).toEqual({
      repository: 'acme/api-service',
      description: 'API',
      defaultBranch: 'main',
      readme: '# API\n',
      files: ['src/http/retry.ts'],
      issues: [{ number: 7, title: 'Retry context', state: 'open' }]
    })
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ authorization: 'Bearer server-secret' })
  })

  it('rejects malformed repository names before making a request', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = new GitHubClient({ fetcher })

    await expect(client.getContext('not-a-repository')).rejects.toThrow('Repository must use owner/name format')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('reads a repository file and decodes its base64 contents', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      content: Buffer.from('export const answer = 42\n').toString('base64'),
      encoding: 'base64',
      sha: 'file-sha'
    })))
    const client = new GitHubClient({ token: 'server-secret', fetcher })

    await expect(client.getFile('acme/api-service', 'src/index.ts')).resolves.toEqual({
      repository: 'acme/api-service',
      path: 'src/index.ts',
      content: 'export const answer = 42\n',
      sha: 'file-sha'
    })
    expect(fetcher).toHaveBeenCalledWith('https://api.github.com/repos/acme/api-service/contents/src/index.ts', expect.objectContaining({
      headers: expect.objectContaining({ authorization: 'Bearer server-secret' })
    }))
  })

  it('rejects unsafe repository file paths before making a request', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = new GitHubClient({ fetcher })

    await expect(client.getFile('acme/api-service', '../.env')).rejects.toThrow('File path must be a safe repository-relative path')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('reads up to 100 files and rejects batches over the limit', async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const path = String(input).split('/contents/')[1]
      return new Response(JSON.stringify({ content: Buffer.from(`// ${path}\n`).toString('base64'), encoding: 'base64', sha: `${path}-sha` }))
    })
    const client = new GitHubClient({ fetcher })
    const files = await client.getFiles('acme/api-service', ['src/a.ts', 'src/b.ts'])

    expect(files).toHaveLength(2)
    expect(files[0]).toMatchObject({ path: 'src/a.ts', content: '// src/a.ts\n' })
    await expect(client.getFiles('acme/api-service', Array.from({ length: 101 }, (_, index) => `src/${index}.ts`))).rejects.toThrow('A maximum of 100 files can be read at once')
  })

  it('rejects a batch whose decoded contents exceed 10 MB', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ content: Buffer.from('x'.repeat(10 * 1024 * 1024 + 1)).toString('base64'), encoding: 'base64' })))
    const client = new GitHubClient({ fetcher })

    await expect(client.getFiles('acme/api-service', ['large.txt'])).rejects.toThrow('Selected GitHub files exceed the 10 MB limit')
  })
})
