import { migrateFrom32To33 } from './32_to_33'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

describe('migrateFrom32To33', () => {
  it('moves legacy sampling custom parameters to dedicated fields', () => {
    const result = migrateFrom32To33({
      version: 32,
      chatModels: [
        {
          id: 'model-1',
          customParameters: [
            { key: 'temperature', value: '0.8' },
            { key: 'top_p', value: '0.9' },
            { key: 'max_tokens', value: '1024' },
            { key: 'foo', value: 'bar' },
          ],
        },
      ],
      assistants: [
        {
          id: 'assistant-1',
          customParameters: [
            { key: 'temperature', value: '0.7' },
            { key: 'max_output_tokens', value: '2048' },
          ],
        },
      ],
    })

    expect(result.version).toBe(33)
    expect(Array.isArray(result.chatModels)).toBe(true)
    expect(Array.isArray(result.assistants)).toBe(true)

    if (
      !Array.isArray(result.chatModels) ||
      !Array.isArray(result.assistants)
    ) {
      throw new Error('Expected migrated chatModels/assistants arrays')
    }

    const model = result.chatModels[0]
    const assistant = result.assistants[0]
    if (!isRecord(model) || !isRecord(assistant)) {
      throw new Error('Expected migrated entries to be objects')
    }

    expect(model.temperature).toBe(0.8)
    expect(model.topP).toBe(0.9)
    expect(model.maxOutputTokens).toBe(1024)
    expect(model.customParameters).toEqual([{ key: 'foo', value: 'bar' }])

    expect(assistant.temperature).toBe(0.7)
    expect(assistant.maxOutputTokens).toBe(2048)
    expect(assistant.customParameters).toEqual([])
  })

  it('keeps existing dedicated fields unchanged', () => {
    const result = migrateFrom32To33({
      version: 32,
      chatModels: [
        {
          id: 'model-1',
          temperature: 1,
          customParameters: [{ key: 'temperature', value: '0.5' }],
        },
      ],
    })

    if (!Array.isArray(result.chatModels) || !isRecord(result.chatModels[0])) {
      throw new Error('Expected migrated chat model')
    }

    expect(result.chatModels[0].temperature).toBe(1)
    expect(result.chatModels[0].customParameters).toEqual([])
  })
})
