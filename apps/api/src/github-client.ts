export interface GitHubContext {
  repository: string
  description: string | null
  defaultBranch: string
  readme: string
  files: string[]
  issues: Array<{ number: number; title: string; state: string }>
}

export interface GitHubFile {
  repository: string
  path: string
  content: string
  sha?: string
}

export interface GitHubClientOptions {
  token?: string
  baseUrl?: string
  fetcher?: typeof fetch
}

export class GitHubClient {
  private readonly token?: string
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token?.trim() || undefined
    this.baseUrl = (options.baseUrl?.trim() || 'https://api.github.com').replace(/\/$/, '')
    this.fetcher = options.fetcher ?? fetch
  }

  async getContext(repository: string): Promise<GitHubContext> {
    const normalized = normalizeRepository(repository)

    const metadata = await this.get(`/repos/${normalized}`) as { full_name?: unknown; description?: unknown; default_branch?: unknown }
    const defaultBranch = typeof metadata.default_branch === 'string' && metadata.default_branch ? metadata.default_branch : 'main'
    const readmePayload = await this.get(`/repos/${normalized}/readme`) as { content?: unknown; encoding?: unknown }
    const treePayload = await this.get(`/repos/${normalized}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`) as { tree?: unknown }
    const issuesPayload = await this.get(`/repos/${normalized}/issues?state=open&per_page=10`) as unknown

    return {
      repository: typeof metadata.full_name === 'string' ? metadata.full_name : normalized,
      description: typeof metadata.description === 'string' ? metadata.description : null,
      defaultBranch,
      readme: decodeReadme(readmePayload),
      files: extractFiles(treePayload),
      issues: extractIssues(issuesPayload)
    }
  }

  async getFile(repository: string, path: string): Promise<GitHubFile> {
    const normalizedRepository = normalizeRepository(repository)
    const normalizedPath = normalizeFilePath(path)
    const payload = await this.get(`/repos/${normalizedRepository}/contents/${encodeRepositoryPath(normalizedPath)}`) as { content?: unknown; encoding?: unknown; sha?: unknown }
    const content = decodeContent(payload)
    if (content === undefined) throw new Error('GitHub file content is unavailable')

    return {
      repository: normalizedRepository,
      path: normalizedPath,
      content,
      ...(typeof payload.sha === 'string' && payload.sha ? { sha: payload.sha } : {})
    }
  }

  private async get(path: string): Promise<unknown> {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': 'forge-agent-read-only',
      'x-github-api-version': '2022-11-28'
    }
    if (this.token) headers.authorization = `Bearer ${this.token}`
    const response = await this.fetcher(`${this.baseUrl}${path}`, { headers })
    if (!response.ok) throw new Error(`GitHub request failed (${response.status})`)
    try {
      return await response.json()
    } catch {
      throw new Error('GitHub response was not valid JSON')
    }
  }
}

function normalizeRepository(repository: string): string {
  const match = /^([^/]+)\/([^/]+)$/.exec(repository.trim())
  if (!match) throw new Error('Repository must use owner/name format')
  return `${match[1]}/${match[2]}`
}

function normalizeFilePath(path: string): string {
  const normalized = path.trim()
  const isSafe = normalized.length > 0 && !normalized.startsWith('/') && !normalized.includes('\\') && !/[\u0000-\u001f]/.test(normalized) && normalized.split('/').every(part => part !== '' && part !== '.' && part !== '..')
  if (!isSafe) throw new Error('File path must be a safe repository-relative path')
  return normalized
}

function encodeRepositoryPath(path: string): string {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

function decodeReadme(payload: { content?: unknown; encoding?: unknown }): string {
  return decodeContent(payload) ?? ''
}

function decodeContent(payload: { content?: unknown; encoding?: unknown }): string | undefined {
  if (typeof payload.content !== 'string') return undefined
  if (payload.encoding === 'base64') return Buffer.from(payload.content.replace(/\s/g, ''), 'base64').toString('utf8')
  return payload.content
}

function extractFiles(payload: { tree?: unknown }): string[] {
  if (!Array.isArray(payload.tree)) return []
  return payload.tree
    .filter(item => item && typeof item === 'object' && (item as { type?: unknown }).type === 'blob')
    .map(item => (item as { path?: unknown }).path)
    .filter((path): path is string => typeof path === 'string')
    .slice(0, 500)
}

function extractIssues(payload: unknown): Array<{ number: number; title: string; state: string }> {
  if (!Array.isArray(payload)) return []
  return payload
    .filter(item => item && typeof item === 'object' && !('pull_request' in item))
    .map(item => item as { number?: unknown; title?: unknown; state?: unknown })
    .filter((item): item is { number: number; title: string; state: string } => typeof item.number === 'number' && typeof item.title === 'string' && typeof item.state === 'string')
}
