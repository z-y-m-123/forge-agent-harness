import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { App } from '../app'
import { HomePage } from '../pages/home-page'

const loadGitHubContext = vi.hoisted(() => vi.fn())

vi.mock('../domain/github-api', () => ({ loadGitHubContext }))

const context = {
  repository: 'octo/forge',
  description: 'A useful project',
  defaultBranch: 'main',
  readme: '# Forge\n\nProject context from GitHub.',
  files: ['README.md', 'src/index.ts'],
  issues: [{ number: 7, title: 'Improve docs', state: 'open' }]
}

it('connects a GitHub repository and shows its context in Project Lens', async () => {
  loadGitHubContext.mockResolvedValue(context)
  render(<App><HomePage /></App>)

  fireEvent.change(screen.getByLabelText('GitHub 仓库'), { target: { value: 'octo/forge' } })
  fireEvent.click(screen.getByRole('button', { name: '连接仓库' }))

  expect(await screen.findByText('octo/forge')).toBeVisible()
  expect(screen.getByText('Project Lens')).toBeVisible()
  expect(screen.getByText('Project context from GitHub.')).toBeVisible()
  expect(screen.getByText('src/index.ts')).toBeVisible()
  expect(screen.getByText('#7 Improve docs')).toBeVisible()
  expect(loadGitHubContext).toHaveBeenCalledWith('octo/forge')
})

it('shows a recoverable error when GitHub loading fails', async () => {
  loadGitHubContext.mockRejectedValue(new Error('GitHub 服务暂时不可用'))
  render(<App><HomePage /></App>)

  fireEvent.change(screen.getByLabelText('GitHub 仓库'), { target: { value: 'octo/forge' } })
  fireEvent.click(screen.getByRole('button', { name: '连接仓库' }))

  expect(await screen.findByText('GitHub 服务暂时不可用')).toBeVisible()
  expect(screen.getByLabelText('GitHub 仓库')).toHaveValue('octo/forge')
})

it('keeps GitHub facts visible after entering free conversation', async () => {
  loadGitHubContext.mockResolvedValue(context)
  render(<App />)

  fireEvent.change(screen.getByLabelText('GitHub 仓库'), { target: { value: 'octo/forge' } })
  fireEvent.click(screen.getByRole('button', { name: '连接仓库' }))
  await screen.findByText('octo/forge')
  fireEvent.click(screen.getByText('自由对话').closest('button')!)

  expect(await screen.findByText('Project context from GitHub.')).toBeVisible()
  expect(screen.getByText('src/index.ts')).toBeVisible()
})
