# Provider API Boundary Design

**Status:** Approved direction

## Goal

Add a small server-side API boundary so the Forge web client can start a model run through a provider abstraction without exposing API keys or coupling the UI to a vendor SDK.

## Scope

This phase adds a new `apps/api` Node service with a provider registry, a deterministic `MockProvider`, and a newline-delimited event response for one agent run. The web app may call the endpoint through a thin client adapter, but the existing local demo remains available as a fallback.

This phase does not include GitHub authentication, repository cloning, real file writes, shell execution, real PR creation, or automatic model-provider credentials. A future provider may read credentials from server environment variables only; browser-supplied keys are not persisted or logged.

## Architecture

```text
Web client -> POST /api/agent/runs -> Run route -> ProviderRegistry -> ModelProvider
                                      \-> NDJSON AgentEvent stream -> Web trajectory
```

The API owns provider selection and event serialization. The provider owns model-specific request/response translation. The shared event vocabulary is compatible with the existing `AgentEventLog`, so the UI can render model and tool events without knowing which provider produced them.

## Contracts

`RunRequest` contains a task id, a user message, and an optional provider id. The server normalizes missing provider ids to `mock`.

`ModelProvider` exposes `run(input): AsyncIterable<AgentEventInput>`. The mock emits a deterministic `model.message`, `tool.started`, and `tool.completed` sequence and never accesses the filesystem or network.

The route returns `400` for malformed JSON or missing required fields, `404` for an unknown provider, and `200` with `application/x-ndjson` for a valid run. Each line is one JSON event; the server does not include credentials or raw request headers in events.

## Error handling and safety

Provider failures become a final `tool.failed`-style event only when they are attributable to a tool operation; route-level validation errors remain HTTP errors. The first implementation only uses the mock, so no external calls occur. The API binds to localhost in development.

## Testing

- Unit-test the mock event sequence and provider registry lookup.
- Integration-test route validation, unknown-provider handling, and NDJSON ordering.
- Keep the existing web unit and Playwright suites green.

