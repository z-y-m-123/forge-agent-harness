import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { App } from '../app'

const { loadGitHubContext, loadGitHubFile, loadGitHubFiles } = vi.hoisted(() => ({ loadGitHubContext: vi.fn(), loadGitHubFile: vi.fn(), loadGitHubFiles: vi.fn() }))

vi.mock('../domain/github-api', () => ({ loadGitHubContext, loadGitHubFile, loadGitHubFiles }))

const context = {
  repository: 'octo/forge',
  description: 'A useful project',
  defaultBranch: 'main',
  readme: '# Forge\n\nProject context from GitHub.',
  files: ['README.md', 'src/index.ts', 'tests/index.test.ts'],
  issues: [{ number: 7, title: 'Improve docs', state: 'open' }]
}

async function connectRepository() {
  loadGitHubContext.mockResolvedValue(context)
  render(<App />)
  fireEvent.change(screen.getByLabelText('GitHub 仓库'), { target: { value: 'octo/forge' } })
  fireEvent.click(screen.getByRole('button', { name: '连接仓库' }))
  await screen.findByText('octo/forge')
}

it('uses connected GitHub repository facts in the code workspace', async () => {
  await connectRepository()
  fireEvent.click(screen.getByText('代码工作台').closest('button')!)

  expect((await screen.findAllByText('octo/forge')).at(-1)).toBeVisible()
  expect(screen.getAllByText('src/index.ts').at(-1)).toBeVisible()
  expect(screen.getByText('只读 GitHub 上下文')).toBeVisible()
  expect(screen.getByText('候选范围')).toBeVisible()
  expect(screen.getByText('尚未读取文件正文')).toBeVisible()
  expect(screen.queryByText('src/http/retry.ts')).not.toBeInTheDocument()
})

it('reads a selected GitHub file into the read-only code panel', async () => {
  loadGitHubFile.mockResolvedValue({ repository: 'octo/forge', path: 'src/index.ts', content: 'export const forge = true\n', sha: 'file-sha' })
  await connectRepository()
  fireEvent.click(screen.getByText('代码工作台').closest('button')!)
  fireEvent.click(await screen.findByRole('button', { name: 'src/index.ts' }))

  expect(loadGitHubFile).toHaveBeenCalledWith('octo/forge', 'src/index.ts')
  expect(await screen.findByText('export const forge = true')).toBeVisible()
  expect(screen.getByText('GitHub 事实 · 已读取文件正文')).toBeVisible()
  expect(screen.getByText('已读取 GitHub 文件：src/index.ts')).toBeVisible()
  expect(screen.getByText('已读取文件证据')).toBeVisible()
  expect(screen.getAllByText('src/index.ts').at(-1)).toBeVisible()
  expect(screen.getAllByText((_content, element) => element?.textContent?.includes('file-sha') ?? false).at(-1)).toBeVisible()
})

it('allows retrying a failed GitHub file read', async () => {
  loadGitHubFile.mockRejectedValueOnce(new Error('Unable to read GitHub file')).mockResolvedValueOnce({ repository: 'octo/forge', path: 'src/index.ts', content: 'export const recovered = true\n' })
  await connectRepository()
  fireEvent.click(screen.getByText('代码工作台').closest('button')!)
  const initialCalls = loadGitHubFile.mock.calls.length
  fireEvent.click(await screen.findByRole('button', { name: 'src/index.ts' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to read GitHub file')
  fireEvent.click(screen.getByRole('button', { name: '重试读取' }))

  expect(loadGitHubFile).toHaveBeenCalledTimes(initialCalls + 2)
  expect(await screen.findByText('export const recovered = true')).toBeVisible()
})

it('reads selected GitHub files in a batch and shows a metadata-only summary', async () => {
  loadGitHubFiles.mockResolvedValue([
    { repository: 'octo/forge', path: 'src/index.ts', content: 'export const forge = true\n', sha: 'file-sha' },
    { repository: 'octo/forge', path: 'tests/index.test.ts', content: 'it("works", () => {})\n', sha: 'test-sha' }
  ])
  await connectRepository()
  fireEvent.click(screen.getByText('代码工作台').closest('button')!)
  fireEvent.click(screen.getByRole('checkbox', { name: '选择 src/index.ts' }))
  fireEvent.click(screen.getByRole('checkbox', { name: '选择 tests/index.test.ts' }))
  fireEvent.click(screen.getByRole('button', { name: '读取已选文件（2）' }))

  expect(loadGitHubFiles).toHaveBeenCalledWith('octo/forge', ['src/index.ts', 'tests/index.test.ts'])
  expect(await screen.findByText('项目摘要')).toBeVisible()
  expect(screen.getByText(/已读取 2 个文件/)).toBeVisible()
  expect(screen.getByText('已读取 GitHub 文件：tests/index.test.ts')).toBeVisible()
})

it('uses the first open GitHub issue in issue mode', async () => {
  await connectRepository()
  fireEvent.click(screen.getByText('Issue 任务').closest('button')!)

  expect(await screen.findByText('ISSUE #7 · octo/forge')).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Improve docs' })).toBeVisible()
  expect(screen.getByText('Project context from GitHub.')).toBeVisible()
})
