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
})
