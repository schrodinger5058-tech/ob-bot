import { migrateFrom31To32 } from './31_to_32'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

describe('migrateFrom31To32', () => {
  it('ensures default assistant exists and is selected', () => {
    const result = migrateFrom31To32({
      version: 31,
      chatModelId: 'model-x',
      assistants: [
        {
          id: 'custom-agent',
          name: 'Custom',
          systemPrompt: 'custom prompt',
        },
      ],
      currentAssistantId: undefined,
    })

    expect(result.version).toBe(32)
    expect(result.currentAssistantId).toBe('__default_agent__')
    expect(Array.isArray(result.assistants)).toBe(true)

    if (!Array.isArray(result.assistants)) {
      throw new Error('Expected assistants to be an array')
    }

    const defaultAssistant = result.assistants.find(
      (assistant) =>
        isRecord(assistant) && assistant.id === '__default_agent__',
    )
    expect(defaultAssistant).toBeDefined()
    expect(isRecord(defaultAssistant) && defaultAssistant.enableTools).toBe(
      false,
    )
  })
})
