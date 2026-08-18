import { describe, expect, it } from 'vitest'
import { createConfiguredRegistry } from './runtime-config.js'

describe('runtime provider configuration', () => {
  it('configures an OpenAI-compatible provider from server environment values', () => {
    const registry = createConfiguredRegistry({
      FORGE_PROVIDER: 'deepseek',
      FORGE_MODEL_API_KEY: 'server-secret',
      FORGE_MODEL_BASE_URL: 'https://api.deepseek.com/v1',
      FORGE_MODEL_NAME: 'deepseek-chat'
    })

    expect(registry.get().id).toBe('deepseek')
  })

  it('keeps mock as the safe default when no provider key is configured', () => {
    expect(createConfiguredRegistry({}).get().id).toBe('mock')
  })

  it('configures Anthropic from the shared server environment values', () => {
    const registry = createConfiguredRegistry({
      FORGE_PROVIDER: 'anthropic',
      FORGE_MODEL_API_KEY: 'server-secret',
      FORGE_MODEL_NAME: 'claude-3-5-sonnet-latest'
    })

    expect(registry.get().id).toBe('anthropic')
  })
})
