import { AnthropicProvider } from './anthropic-provider.js'
import { MockProvider } from './mock-provider.js'
import { OpenAICompatibleProvider } from './openai-compatible-provider.js'
import { ProviderRegistry } from './provider-registry.js'
import type { ProviderConnection } from './contracts.js'

export type RuntimeEnv = Record<string, string | undefined>

export function createProviderFromConnection(connection: ProviderConnection) {
  if (connection.provider === 'mock') return new MockProvider()
  const apiKey = connection.apiKey?.trim()
  if (!apiKey) throw new Error('apiKey is required')
  if (connection.provider === 'anthropic') {
    return new AnthropicProvider({
      id: 'anthropic',
      apiKey,
      baseUrl: connection.baseUrl?.trim() || 'https://api.anthropic.com',
      model: connection.model?.trim() || 'claude-3-5-sonnet-latest'
    })
  }
  return new OpenAICompatibleProvider({
    id: 'openai-compatible',
    apiKey,
    baseUrl: connection.baseUrl?.trim() || 'https://api.openai.com/v1',
    model: connection.model?.trim() || 'gpt-4o-mini'
  })
}

export function createConfiguredRegistry(env: RuntimeEnv = process.env): ProviderRegistry {
  const providerId = env.FORGE_PROVIDER?.trim() || 'mock'
  if (providerId === 'mock') return new ProviderRegistry([new MockProvider()])

  const apiKey = env.FORGE_MODEL_API_KEY?.trim()
  if (!apiKey) throw new Error('FORGE_MODEL_API_KEY is required for a non-mock provider')

  if (providerId === 'anthropic') {
    const provider = new AnthropicProvider({
      id: providerId,
      apiKey,
      baseUrl: env.FORGE_MODEL_BASE_URL?.trim() || 'https://api.anthropic.com',
      model: env.FORGE_MODEL_NAME?.trim() || 'claude-3-5-sonnet-latest'
    })
    return new ProviderRegistry([new MockProvider(), provider], providerId)
  }

  const provider = new OpenAICompatibleProvider({
    id: providerId,
    apiKey,
    baseUrl: env.FORGE_MODEL_BASE_URL?.trim() || 'https://api.openai.com/v1',
    model: env.FORGE_MODEL_NAME?.trim() || 'gpt-4o-mini'
  })
  return new ProviderRegistry([new MockProvider(), provider], providerId)
}
