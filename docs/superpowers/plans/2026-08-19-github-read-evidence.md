# GitHub Read Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry successful GitHub file reads into app state, the Task Spec evidence section, and the workspace Agent trajectory without copying file bodies or expanding permissions.

**Architecture:** Add a small metadata-only `GitHubReadEvidence` type and reducer action to the existing web state. The workspace dispatches the action only after `loadGitHubFile` succeeds; Task Spec and trajectory derive their display from the ordered evidence list. Repository changes clear evidence, while repeated reads replace the same path and move it to the end.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, existing reducer/context patterns.

---

### Task 1: Add evidence state and reducer behavior

**Files:**
- Modify: `apps/web/src/domain/types.ts`
- Modify: `apps/web/src/state/app-reducer.ts`
- Test: `apps/web/src/test/app-reducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Add tests that dispatch `{ type: 'githubFileRead', evidence: { repository: 'octo/forge', path: 'src/index.ts', sha: 'file-sha', readAt: '2026-08-19T10:00:00.000Z' } }` and assert it is stored, dispatch the same path with a new SHA and assert the list remains one item at the newer position, and dispatch `githubContextLoaded` for a different repository after an existing read and assert the list is empty.

- [ ] **Step 2: Run the reducer test and verify RED**

Run `pnpm --filter @forge-agent/web test -- app-reducer.test.ts`. It must fail because `githubReadEvidence` and `githubFileRead` do not exist yet.

- [ ] **Step 3: Implement the minimal state model**

In `apps/web/src/domain/types.ts`, add:

```ts
export interface GitHubReadEvidence {
  repository: string
  path: string
  sha?: string
  readAt: string
}
```

Add `githubReadEvidence: GitHubReadEvidence[]` to `AppState`. Add the `githubFileRead` action to `AppAction`. Initialize the list to `[]`. In the reducer, remove an existing record matching repository/path, append the new evidence, and reset the list to `[]` in `githubContextLoaded`.

- [ ] **Step 4: Run the reducer tests and verify GREEN**

Run `pnpm --filter @forge-agent/web test -- app-reducer.test.ts`. Expected: all reducer tests pass.

- [ ] **Step 5: Commit the state change**

```bash
git add apps/web/src/domain/types.ts apps/web/src/state/app-reducer.ts apps/web/src/test/app-reducer.test.ts
git commit -m "feat: track GitHub read evidence"
```

### Task 2: Record successful reads from the workspace

**Files:**
- Modify: `apps/web/src/pages/workspace-page.tsx`
- Test: `apps/web/src/test/github-context-modes.test.tsx`

- [ ] **Step 1: Write the failing integration assertion**

After the existing successful file-read assertion, assert that the connected app state renders the evidence in the Agent trajectory as `已读取 GitHub 文件：src/index.ts`. Use the existing `App` render path and do not mock any new API.

- [ ] **Step 2: Run the focused test and verify RED**

Run `pnpm --filter @forge-agent/web test -- github-context-modes.test.tsx`. Expected: the new trajectory assertion fails because the workspace currently keeps the file body only in local component state.

- [ ] **Step 3: Dispatch evidence after a successful file response**

Change `WorkspacePage` to read `dispatch` from `useApp`. After `loadGitHubFile` resolves, dispatch:

```ts
dispatch({
  type: 'githubFileRead',
  evidence: {
    repository: file.repository,
    path: file.path,
    ...(file.sha ? { sha: file.sha } : {}),
    readAt: new Date().toISOString()
  }
})
```

Do not dispatch in the catch branch. Keep `loadedFile.content` local to the code panel.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run `pnpm --filter @forge-agent/web test -- github-context-modes.test.tsx`. Expected: the new trajectory assertion and all existing mode tests pass.

- [ ] **Step 5: Commit workspace recording**

```bash
git add apps/web/src/pages/workspace-page.tsx apps/web/src/test/github-context-modes.test.tsx
git commit -m "feat: record successful GitHub reads"
```

### Task 3: Show evidence in Task Spec and trajectory

**Files:**
- Modify: `apps/web/src/components/task-spec-panel.tsx`
- Modify: `apps/web/src/pages/workspace-page.tsx`
- Modify: `apps/web/src/styles/app.css`
- Test: `apps/web/src/test/github-context-modes.test.tsx`

- [ ] **Step 1: Write failing Task Spec assertions**

After reading `src/index.ts`, navigate to the code workspace Task Spec and assert `已读取文件证据` and `src/index.ts · file-sha` are visible. Add a separate assertion in the no-read workspace test that `尚未读取文件正文` is visible.

- [ ] **Step 2: Run the focused test and verify RED**

Run `pnpm --filter @forge-agent/web test -- github-context-modes.test.tsx`. Expected: the evidence labels fail because Task Spec currently always renders the generic sentence.

- [ ] **Step 3: Render metadata-only evidence**

In `TaskSpecPanel`, read `state.githubReadEvidence`. For GitHub projects, render a checked list labeled `已读取文件证据`; render each item as the path plus ` · SHA ...` when a SHA exists. When empty, render `尚未读取文件正文`; retain the existing candidate scope section separately. In `WorkspacePage`, render `state.githubReadEvidence.map(...)` as completed trajectory entries, with a stable key including repository/path/readAt.

- [ ] **Step 4: Add compact evidence styling**

Add CSS for the evidence list so long paths wrap inside the agent pane and SHA text uses muted styling. Do not add a nested card or change the read-only banner.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run `pnpm --filter @forge-agent/web test -- github-context-modes.test.tsx`. Expected: all mode, read, retry, trajectory, and Task Spec assertions pass.

- [ ] **Step 6: Commit the UI evidence**

```bash
git add apps/web/src/components/task-spec-panel.tsx apps/web/src/pages/workspace-page.tsx apps/web/src/styles/app.css apps/web/src/test/github-context-modes.test.tsx
git commit -m "feat: surface GitHub read evidence"
```

### Task 4: Full verification

**Files:** None.

- [ ] **Step 1: Run API tests and typecheck**

Run `pnpm --filter @forge-agent/api test` and `pnpm --filter @forge-agent/api typecheck`. Expected: 25 API tests pass and TypeScript exits 0.

- [ ] **Step 2: Run web tests and typecheck**

Run `pnpm --filter @forge-agent/web test` and `pnpm --filter @forge-agent/web typecheck`. Expected: all web tests pass and TypeScript exits 0.

- [ ] **Step 3: Build and run E2E**

Run `pnpm --filter @forge-agent/web build` and `pnpm --filter @forge-agent/web test:e2e`. Expected: production build succeeds and the existing approval-gated journey passes.

- [ ] **Step 4: Check the diff and working tree**

Run `git diff --check` and `git status --short --branch`. Expected: no whitespace errors and only intended commits are present.
