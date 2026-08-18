import type { ModelProvider } from './provider.js'

export class ProviderRegistry {
  private readonly providers: Map<string, ModelProvider>

  constructor(providers: ModelProvider[]) {
    this.providers = new Map(providers.map(provider => [provider.id, provider]))
  }

  get(id = 'mock'): ModelProvider {
    const provider = this.providers.get(id)
    if (!provider) throw new Error(`Unknown provider: ${id}`)
    return provider
  }
}
