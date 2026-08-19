import { describe, expect, it } from 'vitest'
import { chunkGitHubContent, summarizeGitHubFiles } from '../domain/github-summary'

describe('GitHub project summary', () => {
  it('splits large content by UTF-8 byte size without losing text', () => {
    const content = '中'.repeat(400)
    const chunks = chunkGitHubContent(content, 512)

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.map(chunk => chunk.content).join('')).toBe(content)
    expect(chunks.every(chunk => new TextEncoder().encode(chunk.content).byteLength <= 512)).toBe(true)
  })

  it('summarizes metadata and chunk counts without including file bodies', () => {
    const summary = summarizeGitHubFiles([{ repository: 'octo/forge', path: 'src/index.ts', content: 'a\nb\n', sha: 'sha-1' }])

    expect(summary.files).toEqual([{ path: 'src/index.ts', sha: 'sha-1', bytes: 4, lines: 3, chunks: 1 }])
    expect(summary.overview).toContain('1 个文件')
    expect(summary.overview).not.toContain('a\nb')
  })
})
