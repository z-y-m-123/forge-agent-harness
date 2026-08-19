import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { App } from '../app'
import { ChatPage } from '../pages/chat-page'

const streamAgentRun = vi.hoisted(() => vi.fn())
vi.mock('../domain/agent-api', () => ({ streamAgentRun }))

it('turns a free-form task into an exploration reply and Task Spec', async () => {
  streamAgentRun.mockResolvedValue([{ type: 'model.message', actor: 'coordinator', summary: '我会先探索，不会改代码。' }])
  render(<App><ChatPage /></App>)
  fireEvent.change(screen.getByLabelText('任务描述'), { target: { value: '排查 API 请求偶发失败，但不要改代码。' } })
  fireEvent.click(screen.getByRole('button', { name: '发送' }))
  expect(await screen.findByText('我会先探索，不会改代码。')).toBeVisible()
  expect(screen.getByText('排查 API 请求偶发失败，但不要改代码。')).toBeVisible()
  const createTaskSpec = screen.getByRole('button', { name: '基于当前任务创建 Task Spec' })
  expect(createTaskSpec).toBeEnabled()
  fireEvent.click(createTaskSpec)
  expect(await screen.findByText('请先确认任务边界')).toBeVisible()
})
