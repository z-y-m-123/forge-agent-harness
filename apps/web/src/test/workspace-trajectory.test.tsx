import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { App } from '../app'
import { WorkspacePage } from '../pages/workspace-page'

const streamAgentRun = vi.hoisted(() => vi.fn())

vi.mock('../domain/agent-api', () => ({ streamAgentRun }))

it('renders the API trajectory after task approval', async () => {
  streamAgentRun.mockResolvedValue([
    { type: 'model.message', actor: 'coordinator', summary: 'I will inspect retry handling.' },
    { type: 'tool.started', actor: 'explorer', tool: 'readFile', summary: 'readFile started' },
    { type: 'tool.completed', actor: 'explorer', tool: 'readFile', summary: 'readFile completed' }
  ])
  render(<App><WorkspacePage /></App>)

  fireEvent.click(screen.getByRole('button', { name: '批准任务并创建计划' }))

  expect(await screen.findByText('readFile completed')).toBeVisible()
  expect(streamAgentRun).toHaveBeenCalledWith({
    taskId: 'demo-retry-318',
    message: 'Inspect retry handling without editing code.',
    provider: undefined
  })
})
