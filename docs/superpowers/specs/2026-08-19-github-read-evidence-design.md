# GitHub Read Evidence Design

## Goal

Make each GitHub file read visible as an auditable fact throughout the Forge Agent task flow, without expanding the current read-only permission boundary.

## Scope

When a user reads a file from the workspace tree, the app records the file path and optional GitHub blob SHA in browser state. The task specification and the workspace trajectory render that record as evidence.

The evidence record contains metadata only. The file body remains in the workspace component and is not copied into task state, prompts, or execution payloads.

## Data Model

Add `GitHubReadEvidence` to the web domain with `repository`, `path`, `sha?`, and `readAt` fields. `AppState` owns an ordered, de-duplicated `githubReadEvidence` list. Re-reading a path replaces its prior record and moves it to the newest position.

The reducer accepts `githubFileRead` after a successful `loadGitHubFile` response. Loading a different GitHub repository clears all previous evidence alongside the prior project state.

## UI

The workspace trajectory adds a completed entry for each recorded read, for example `已读取 GitHub 文件：src/index.ts`.

For a connected GitHub repository, Task Spec changes its evidence section from a generic traceability statement to a concrete list of the recorded paths. If no files have been read, it states that file-body evidence has not yet been collected. Candidate scope remains separate and is never automatically promoted from read evidence.

## Boundaries

- No new API endpoint, GitHub permission, tool, prompt, or write capability.
- A read event does not approve a task, change scope, run tests, generate a diff, or make a file editable.
- Existing repository metadata, file tree, README, and Issue behavior remains unchanged.

## Error Handling

Only successful file reads create evidence. Failed reads and retry attempts leave prior successful evidence unchanged.

## Verification

Add reducer tests for recording, de-duplicating, and clearing evidence. Add workspace tests that read a file and assert both the trajectory entry and Task Spec evidence label. Run complete API and web test suites, type checks, production build, Playwright E2E, and `git diff --check`.
