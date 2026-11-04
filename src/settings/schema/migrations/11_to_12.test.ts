import { migrateFrom11To12 } from './11_to_12'

describe('migrateFrom11To12', () => {
  it('should migrate model IDs to include provider prefix', () => {
    const inputData = {
      version: 11,
      chatModels: [
        {
          providerType: 'openai',
          providerId: 'openai',
          id: 'gpt-4',
          model: 'gpt-4',
          enable: true,
        },
        {
          providerType: 'anthropic',
          providerId: 'anthropic',
          id: 'claude-3.5-sonnet',
          model: 'claude-3-5-sonnet-latest',
          enable: true,
        },
        {
          providerType: 'gemini',
          providerId: 'gemini',
          id: 'gemini-2.5-flash',
          model: 'gemini-2.5-flash',
          enable: true,
        },
      ],
      embeddingModels: [
        {
          providerType: 'openai',
          providerId: 'openai',
          id: 'text-embedding-3-small',
          model: 'text-embedding-3-small',
          dimension: 1536,
        },
      ],
      chatModelId: 'gpt-4',
      applyModelId: 'gpt-4',
      embeddingModelId: 'text-embedding-3-small',
    }

    const result = migrateFrom11To12(inputData)

    expect(result.version).toBe(12)

    // Check that model IDs are migrated with provider prefix
    expect(result.chatModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'openai/gpt-4',
          providerId: 'openai',
        }),
        expect.objectContaining({
          id: 'anthropic/claude-3.5-sonnet',
          providerId: 'anthropic',
        }),
        expect.objectContaining({
          id: 'gemini/gemini-2.5-flash',
          providerId: 'gemini',
        }),
      ]),
    )

    expect(result.embeddingModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'openai/text-embedding-3-small',
          providerId: 'openai',
        }),
      ]),
    )

    // Check that selected model IDs are migrated
    expect(result.chatModelId).toBe('openai/gpt-4')
    expect(result.applyModelId).toBe('openai/gpt-4')
    expect(result.embeddingModelId).toBe('openai/text-embedding-3-small')
  })

  it('should handle models that already have provider prefix', () => {
    const inputData = {
      version: 11,
      chatModels: [
        {
          providerType: 'openai',
          providerId: 'custom-openai',
          id: 'custom-openai/gpt-4',
          model: 'gpt-4',
          enable: true,
        },
      ],
      chatModelId: 'custom-openai/gpt-4',
      applyModelId: 'custom-openai/gpt-4',
    }

    const result = migrateFrom11To12(inputData)

    // Should not double-prefix already prefixed IDs
    type ModelLite = { id: string }
    const isModelLite = (m: unknown): m is ModelLite => {
      if (typeof m !== 'object' || m === null) return false
      const rec = m as Record<string, unknown>
      return typeof rec.id === 'string'
    }
    const chatModels = Array.isArray(result.chatModels)
      ? result.chatModels.filter(isModelLite)
      : ([] as ModelLite[])
    const customModel = chatModels.find((m) => m.id === 'custom-openai/gpt-4')
    expect(customModel).toBeDefined()
    if (!customModel) throw new Error('customModel not found')
    expect(customModel.id).toBe('custom-openai/gpt-4')
    expect(result.chatModelId).toBe('custom-openai/gpt-4')
    expect(result.applyModelId).toBe('custom-openai/gpt-4')
  })

  it('should handle missing model arrays gracefully', () => {
    const inputData = {
      version: 11,
      chatModelId: 'gpt-4',
      applyModelId: 'claude-3.5-sonnet',
      embeddingModelId: 'text-embedding-3-small',
    }

    const result = migrateFrom11To12(inputData)

    expect(result.version).toBe(12)
    // Should fallback to openai prefix when model not found
    expect(result.chatModelId).toBe('openai/gpt-4')
    expect(result.applyModelId).toBe('openai/claude-3.5-sonnet')
    expect(result.embeddingModelId).toBe('openai/text-embedding-3-small')
  })

  it('should handle different provider types correctly', () => {
    const inputData = {
      version: 11,
      chatModels: [
        {
          providerType: 'openai-compatible',
          providerId: 'oneapi',
          id: 'gemini-2.5-flash',
          model: 'gemini-2.5-flash',
          enable: true,
        },
        {
          providerType: 'gemini',
          providerId: 'vertex',
          id: 'gemini-2.5-flash',
          model: 'gemini-2.5-flash',
          enable: true,
        },
      ],
      chatModelId: 'gemini-2.5-flash',
    }

    const result = migrateFrom11To12(inputData)

    // Should create different prefixed IDs for same model name from different providers
    type ModelWithProvider = { id: string; providerId: string }
    const isModelWithProvider = (m: unknown): m is ModelWithProvider => {
      if (typeof m !== 'object' || m === null) return false
      const rec = m as Record<string, unknown>
      return typeof rec.id === 'string' && typeof rec.providerId === 'string'
    }
    const chatModels = Array.isArray(result.chatModels)
      ? result.chatModels.filter(isModelWithProvider)
      : ([] as ModelWithProvider[])
    const oneapiModel = chatModels.find((m) => m.providerId === 'oneapi')
    const vertexModel = chatModels.find((m) => m.providerId === 'vertex')

    expect(oneapiModel?.id).toBe('oneapi/gemini-2.5-flash')
    expect(vertexModel?.id).toBe('vertex/gemini-2.5-flash')
  })
})
