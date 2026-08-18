import type { ModelProvider } from './provider.js'

export class ProviderRegistry {
  private readonly providers: Map<string, ModelProvider>
  private readonly defaultId: string

  constructor(providers: ModelProvider[], defaultId = 'mock') {
    this.providers = new Map(providers.map(provider => [provider.id, provider]))
    this.defaultId = defaultId
  }

  get(id = this.defaultId): ModelProvider {
    const provider = this.providers.get(id)
    if (!provider) throw new Error(`Unknown provider: ${id}`)
    return provider
  }
}
