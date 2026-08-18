# Provider API Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local Node API that routes one agent run through a provider registry and returns a deterministic NDJSON event stream without exposing credentials.

**Architecture:** `apps/api` uses Node's built-in HTTP server so the boundary has no framework-specific behavior. A `ModelProvider` interface and `ProviderRegistry` isolate provider selection from HTTP serialization; `MockProvider` is the only registered provider in this phase. The web package gets a small NDJSON client parser but keeps its existing local demo as the default.

**Tech Stack:** Node 22+, TypeScript, Node `http`, Vitest, React web client.

---

### Task 1: Define provider and event contracts

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/contracts.ts`
- Create: `apps/api/src/provider.ts`
- Create: `apps/api/src/provider-registry.ts`
- Create: `apps/api/src/mock-provider.ts`
- Create: `apps/api/src/provider.test.ts`

- [x] **Step 1: Write the failing contract tests**

Cover deterministic mock ordering and registry lookup/default behavior.

- [x] **Step 2: Run the focused API test and verify it fails**

Run: `pnpm --filter @forge-agent/api test`

Expected: FAIL because the API package and provider modules do not exist.

- [x] **Step 3: Implement the minimal contracts and MockProvider**

Define `RunRequest`, `AgentEventInput`, `ModelProvider`, `ProviderRegistry`, and a mock that emits one model message plus the read tool start/completion events. The mock must not access filesystem, network, environment secrets, or process execution.

- [x] **Step 4: Run the focused API test and verify it passes**

Run: `pnpm --filter @forge-agent/api test`

Expected: all provider tests pass.

- [x] **Step 5: Commit**

```powershell
git add apps/api
git commit -m "feat: add provider contracts and mock provider"
```

### Task 2: Implement the NDJSON run endpoint

**Files:**
- Create: `apps/api/src/http-server.ts`
- Create: `apps/api/src/http-server.test.ts`
- Modify: `apps/api/package.json`

- [x] **Step 1: Write failing route tests**

Test malformed JSON and missing message return `400`, unknown provider returns `404`, and a valid request returns `200` with ordered NDJSON events and the correct content type.

- [x] **Step 2: Run route tests to verify they fail**

Run: `pnpm --filter @forge-agent/api test src/http-server.test.ts`

Expected: FAIL because the HTTP handler does not exist.

- [x] **Step 3: Implement the HTTP handler and server entrypoint**

Use `node:http`, parse only `POST /api/agent/runs`, validate the request, select a provider, and write each event as one JSON line. Expose a testable `createServer(registry)` and a `startServer()` that binds to `127.0.0.1`.

- [x] **Step 4: Run route tests and typecheck**

Run: `pnpm --filter @forge-agent/api test src/http-server.test.ts` and `pnpm --filter @forge-agent/api typecheck`

Expected: all route tests and TypeScript checks pass.

- [x] **Step 5: Commit**

```powershell
git add apps/api
git commit -m "feat: add provider run api"
```

### Task 3: Add a typed web client for provider runs

**Files:**
- Create: `apps/web/src/domain/agent-api.ts`
- Create: `apps/web/src/test/agent-api.test.ts`

- [x] **Step 1: Write the failing parser/client tests**

Mock `fetch`, assert the client sends the task id/message/provider, parses each NDJSON line, and reports non-2xx responses as errors.

- [x] **Step 2: Run the focused web test to verify it fails**

Run: `pnpm --filter @forge-agent/web test src/test/agent-api.test.ts`

Expected: FAIL because the client module does not exist.

- [x] **Step 3: Implement the minimal typed client**

Expose `streamAgentRun(request, fetcher = fetch)` returning `Promise<AgentEventInput[]>`. Keep provider credentials out of the request type and preserve event order.

- [x] **Step 4: Run focused test, all unit tests, and typecheck**

Run: `pnpm --filter @forge-agent/web test src/test/agent-api.test.ts; pnpm test; pnpm typecheck`

Expected: all tests and type checks pass.

- [x] **Step 5: Commit**

```powershell
git add apps/web/src/domain/agent-api.ts apps/web/src/test/agent-api.test.ts
git commit -m "feat: add typed provider api client"
```

### Task 4: Verify the complete boundary

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml` only if required by package discovery

- [x] **Step 1: Add root API scripts**

Add `api:test`, `api:typecheck`, and `api:dev` forwarding commands without changing the existing web scripts.

- [x] **Step 2: Run the complete verification suite**

Run: `pnpm test; pnpm typecheck; pnpm build; pnpm api:test; pnpm api:typecheck`

Expected: all commands exit with code 0.

- [x] **Step 3: Commit**

```powershell
git add package.json
git commit -m "chore: add api verification scripts"
```
