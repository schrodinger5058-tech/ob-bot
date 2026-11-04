import { migrateFrom12To13 } from './12_to_13'

describe('migrateFrom12To13', () => {
  it('should add tab completion defaults when fields are missing', () => {
    const result = migrateFrom12To13({
      version: 12,
      continuationOptions: {
        useCurrentModel: true,
        fixedModelId: 'openai/gpt-4.1-mini',
      },
    })

    expect(result.version).toBe(13)
    const continuation = result.continuationOptions as Record<string, unknown>
    expect(continuation.enableTabCompletion).toBe(false)
    expect(continuation.tabCompletionModelId).toBe('openai/gpt-4.1-mini')
  })

  it('should preserve existing tab completion settings', () => {
    const result = migrateFrom12To13({
      version: 12,
      continuationOptions: {
        enableTabCompletion: true,
        tabCompletionModelId: 'anthropic/claude-3.5-sonnet',
      },
    })

    expect(result.version).toBe(13)
    const continuation = result.continuationOptions as Record<string, unknown>
    expect(continuation.enableTabCompletion).toBe(true)
    expect(continuation.tabCompletionModelId).toBe(
      'anthropic/claude-3.5-sonnet',
    )
  })
})
