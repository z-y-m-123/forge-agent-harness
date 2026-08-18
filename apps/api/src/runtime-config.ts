import { AnthropicProvider } from './anthropic-provider.js'
import { MockProvider } from './mock-provider.js'
import { OpenAICompatibleProvider } from './openai-compatible-provider.js'
import { ProviderRegistry } from './provider-registry.js'

export type RuntimeEnv = Record<string, string | undefined>

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
