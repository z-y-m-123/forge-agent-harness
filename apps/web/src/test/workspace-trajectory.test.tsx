import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { App } from '../app'
import { WorkspacePage } from '../pages/workspace-page'

it('renders the approved demo tool trajectory in the workspace', async () => {
  render(<App><WorkspacePage /></App>)

  fireEvent.click(screen.getByRole('button', { name: '批准任务并创建计划' }))

  expect(await screen.findByText('readFile completed')).toBeVisible()
})
