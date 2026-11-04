import { migrateFrom15To16 } from './15_to_16'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

describe('migrateFrom15To16', () => {
  it('should enable super continuation when legacy setting used fixed model', () => {
    const result = migrateFrom15To16({
      version: 15,
      chatModelId: 'openai/gpt-4o-mini',
      continuationOptions: {
        useCurrentModel: false,
        fixedModelId: 'anthropic/claude-3-haiku',
      },
    })

    expect(result.version).toBe(16)
    if (!isRecord(result.continuationOptions)) {
      throw new Error('Expected continuationOptions to be an object')
    }
    const continuationOptions = result.continuationOptions
    const enableSuperContinuation = continuationOptions.enableSuperContinuation
    if (typeof enableSuperContinuation !== 'boolean') {
      throw new Error('Expected enableSuperContinuation to be a boolean')
    }
    expect(enableSuperContinuation).toBe(true)
    const continuationModelId = continuationOptions.continuationModelId
    if (typeof continuationModelId !== 'string') {
      throw new Error('Expected continuationModelId to be a string')
    }
    expect(continuationModelId).toBe('anthropic/claude-3-haiku')
    expect('useCurrentModel' in continuationOptions).toBe(false)
    expect('fixedModelId' in continuationOptions).toBe(false)
  })

  it('should disable super continuation when legacy setting used chat model', () => {
    const result = migrateFrom15To16({
      version: 15,
      chatModelId: 'openai/gpt-4o-mini',
      continuationOptions: {
        useCurrentModel: true,
      },
    })

    expect(result.version).toBe(16)
    if (!isRecord(result.continuationOptions)) {
      throw new Error('Expected continuationOptions to be an object')
    }
    const continuationOptions = result.continuationOptions
    const enableSuperContinuation = continuationOptions.enableSuperContinuation
    if (typeof enableSuperContinuation !== 'boolean') {
      throw new Error('Expected enableSuperContinuation to be a boolean')
    }
    expect(enableSuperContinuation).toBe(false)
    const continuationModelId = continuationOptions.continuationModelId
    if (typeof continuationModelId !== 'string') {
      throw new Error('Expected continuationModelId to be a string')
    }
    expect(continuationModelId).toBe('openai/gpt-4o-mini')
  })

  it('should fall back to default model when no data present', () => {
    const result = migrateFrom15To16({ version: 15 })

    expect(result.version).toBe(16)
    if (!isRecord(result.continuationOptions)) {
      throw new Error('Expected continuationOptions to be an object')
    }
    const continuationOptions = result.continuationOptions
    const enableSuperContinuation = continuationOptions.enableSuperContinuation
    if (typeof enableSuperContinuation !== 'boolean') {
      throw new Error('Expected enableSuperContinuation to be a boolean')
    }
    expect(enableSuperContinuation).toBe(false)
    const continuationModelId = continuationOptions.continuationModelId
    expect(typeof continuationModelId).toBe('string')
  })
})
