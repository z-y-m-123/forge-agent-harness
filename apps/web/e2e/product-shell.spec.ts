import { expect, test } from '@playwright/test'

test('Chinese-first project task journey keeps execution approval gated', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '选择一个项目' })).toBeVisible()
  await page.getByRole('button', { name: /acme\/api-service/i }).click()
  await page.getByRole('button', { name: '代码工作台' }).click()
  await expect(page.getByText('不改代码')).toBeVisible()
  await page.getByRole('button', { name: '批准任务并创建计划' }).click()
  await expect(page.getByText('执行计划')).toBeVisible()
  await expect(page.getByText('readFile completed')).toBeVisible()
})
