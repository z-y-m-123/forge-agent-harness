export type { GitHubContext } from './types'
import type { GitHubContext } from './types'

export interface GitHubFile {
  repository: string
  path: string
  content: string
  sha?: string
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function loadGitHubContext(repository: string, fetcher: Fetcher = fetch): Promise<GitHubContext> {
  const response = await fetcher('/api/github/context', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ repository })
  })
  const body = await response.text()
  if (!response.ok) {
    let message = `GitHub context request failed (${response.status})`
    try {
      const parsed: unknown = JSON.parse(body)
      if (parsed && typeof parsed === 'object' && typeof (parsed as { error?: unknown }).error === 'string') message = (parsed as { error: string }).error
    } catch {
      if (body.trim()) message = body.trim()
    }
    throw new Error(message)
  }
  return JSON.parse(body) as GitHubContext
}

export async function loadGitHubFile(repository: string, path: string, fetcher: Fetcher = fetch): Promise<GitHubFile> {
  const response = await fetcher('/api/github/file', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ repository, path })
  })
  const body = await response.text()
  if (!response.ok) {
    let message = `GitHub file request failed (${response.status})`
    try {
      const parsed: unknown = JSON.parse(body)
      if (parsed && typeof parsed === 'object' && typeof (parsed as { error?: unknown }).error === 'string') message = (parsed as { error: string }).error
    } catch {
      if (body.trim()) message = body.trim()
    }
    throw new Error(message)
  }
  return JSON.parse(body) as GitHubFile
}

export async function loadGitHubFiles(repository: string, paths: string[], fetcher: Fetcher = fetch): Promise<GitHubFile[]> {
  const response = await fetcher('/api/github/files', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ repository, paths })
  })
  const body = await response.text()
  if (!response.ok) {
    let message = `GitHub files request failed (${response.status})`
    try {
      const parsed: unknown = JSON.parse(body)
      if (parsed && typeof parsed === 'object' && typeof (parsed as { error?: unknown }).error === 'string') message = (parsed as { error: string }).error
    } catch {
      if (body.trim()) message = body.trim()
    }
    throw new Error(message)
  }
  return JSON.parse(body) as GitHubFile[]
}
