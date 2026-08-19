import type { GitHubFile } from './github-api'

export const DEFAULT_GITHUB_SELECTION_LIMIT = 10
export const MAX_GITHUB_SELECTION_LIMIT = 100
export const GITHUB_CHUNK_BYTES = 512 * 1024

export interface GitHubFileChunk {
  index: number
  start: number
  end: number
  content: string
}

export interface GitHubFileSummary {
  path: string
  sha?: string
  bytes: number
  lines: number
  chunks: number
}

export interface GitHubProjectSummary {
  totalBytes: number
  files: GitHubFileSummary[]
  overview: string
}

export function chunkGitHubContent(content: string, maxBytes = GITHUB_CHUNK_BYTES): GitHubFileChunk[] {
  if (maxBytes <= 0) throw new Error('Chunk size must be positive')
  const encoder = new TextEncoder()
  const chunks: GitHubFileChunk[] = []
  let start = 0
  let chunkStart = 0
  let bytes = 0
  let index = 0
  for (const character of content) {
    const characterBytes = encoder.encode(character).byteLength
    if (bytes > 0 && bytes + characterBytes > maxBytes) {
      chunks.push({ index, start: chunkStart, end: start, content: content.slice(chunkStart, start) })
      index += 1
      chunkStart = start
      bytes = 0
    }
    bytes += characterBytes
    start += character.length
  }
  if (chunkStart < content.length || content.length === 0) chunks.push({ index, start: chunkStart, end: content.length, content: content.slice(chunkStart) })
  return chunks
}

export function summarizeGitHubFiles(files: GitHubFile[]): GitHubProjectSummary {
  const summaries = files.map(file => {
    const bytes = new TextEncoder().encode(file.content).byteLength
    return { path: file.path, ...(file.sha ? { sha: file.sha } : {}), bytes, lines: file.content ? file.content.split(/\r?\n/).length : 0, chunks: chunkGitHubContent(file.content).length }
  })
  const totalBytes = summaries.reduce((total, file) => total + file.bytes, 0)
  const overview = summaries.length ? `已读取 ${summaries.length} 个文件，共 ${totalBytes.toLocaleString('zh-CN')} 字节；大文件已按 512 KB 分块。` : '尚未读取文件正文。'
  return { totalBytes, files: summaries, overview }
}
