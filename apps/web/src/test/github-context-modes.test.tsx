import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { App } from '../app'

const loadGitHubContext = vi.hoisted(() => vi.fn())

vi.mock('../domain/github-api', () => ({ loadGitHubContext }))

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
  expect(screen.queryByText('src/http/retry.ts')).not.toBeInTheDocument()
})

it('uses the first open GitHub issue in issue mode', async () => {
  await connectRepository()
  fireEvent.click(screen.getByText('Issue 任务').closest('button')!)

  expect(await screen.findByText('ISSUE #7 · octo/forge')).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Improve docs' })).toBeVisible()
  expect(screen.getByText('Project context from GitHub.')).toBeVisible()
})
