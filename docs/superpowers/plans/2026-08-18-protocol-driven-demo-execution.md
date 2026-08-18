# Protocol-Driven Demo Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Task Spec approval action run a safe local demonstration step and render its audited event trajectory in the workspace.

**Architecture:** A UI-local demo runner will construct the existing `TaskSpec`, call `runToolStep` only after approval, and retain its `AgentEventLog` in React state. The runner returns a fixed local source excerpt and never accesses a repository, network, shell, provider, or credential.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, existing Lucide icons.

---

### Task 1: Create a deterministic demo execution helper

**Files:**
- Create: `apps/web/src/domain/demo-execution.ts`
- Create: `apps/web/src/test/demo-execution.test.ts`

- [x] **Step 1: Write the failing test**

```ts
import { expect, it } from 'vitest'
import { runDemoExecution } from '../domain/demo-execution'

it('returns a blocked result before approval and a tool trajectory after approval', async () => {
  const blocked = await runDemoExecution(false)
  const completed = await runDemoExecution(true)

  expect(blocked.status).toBe('blocked')
  expect(completed.status).toBe('completed')
  if (completed.status === 'completed') {
    expect(completed.log.events.map(event => event.type)).toEqual(['tool.started', 'tool.completed'])
  }
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @forge-agent/web test src/test/demo-execution.test.ts`

Expected: FAIL because `demo-execution` does not exist.

- [x] **Step 3: Write the minimal implementation**

```ts
export async function runDemoExecution(approved: boolean) {
  const task = createTaskSpec({ id: 'demo-retry-318', projectId: 'api-service', outcome: 'Preserve retry context', inScopeFiles: ['src/http/retry.ts'], acceptanceEvidence: ['Focused test passes'] })
  const executableTask = approved ? { ...task, approval: { status: 'approved' as const, approvedAt: '2026-08-18T00:00:00.000Z' } } : task
  return runToolStep({ task: executableTask, log: createEventLog(task.id), tool: 'readFile', run: async () => 'demo source excerpt' })
}
```

- [x] **Step 4: Run focused test to verify it passes**

Run: `pnpm --filter @forge-agent/web test src/test/demo-execution.test.ts`

Expected: PASS with one test.

- [x] **Step 5: Commit**

```powershell
git add apps/web/src/domain/demo-execution.ts apps/web/src/test/demo-execution.test.ts
git commit -m "feat: add deterministic demo execution"
```

### Task 2: Connect approval UI to the demo trajectory

**Files:**
- Modify: `apps/web/src/components/task-spec-panel.tsx`
- Modify: `apps/web/src/pages/workspace-page.tsx`
- Create: `apps/web/src/test/workspace-trajectory.test.tsx`

- [x] **Step 1: Write the failing test**

```tsx
render(<WorkspacePage />)
await user.click(screen.getByRole('button', { name: '批准任务并创建计划' }))
expect(await screen.findByText('readFile completed')).toBeVisible()
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @forge-agent/web test src/test/workspace-trajectory.test.tsx`

Expected: FAIL because the workspace does not own or render a demo event log.

- [x] **Step 3: Implement local-only event state**

`WorkspacePage` creates an empty `AgentEventLog`, passes an `onApproved` callback to `TaskSpecPanel`, and renders returned event summaries under `Agent trajectory`. `TaskSpecPanel` dispatches `taskApproved` before calling `onApproved`. No tool execution happens outside `runDemoExecution(true)`.

- [x] **Step 4: Run the focused test to verify it passes**

Run: `pnpm --filter @forge-agent/web test src/test/workspace-trajectory.test.tsx`

Expected: PASS with the completed tool event visible.

- [x] **Step 5: Commit**

```powershell
git add apps/web/src/components/task-spec-panel.tsx apps/web/src/pages/workspace-page.tsx apps/web/src/test/workspace-trajectory.test.tsx
git commit -m "feat: render approval-gated demo trajectory"
```

### Task 3: Verify the protected demonstration journey

**Files:**
- Modify: `apps/web/e2e/product-shell.spec.ts`

- [x] **Step 1: Add the new browser assertion**

```ts
await page.getByRole('button', { name: '批准任务并创建计划' }).click()
await expect(page.getByText('readFile completed')).toBeVisible()
```

- [x] **Step 2: Run all checks**

Run: `pnpm test; pnpm typecheck; pnpm build; pnpm test:e2e`

Expected: all commands exit with code 0.

- [x] **Step 3: Commit**

```powershell
git add apps/web/e2e/product-shell.spec.ts
git commit -m "test: cover approval-gated demo trajectory"
```
