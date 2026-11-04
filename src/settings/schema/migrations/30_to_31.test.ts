import { migrateFrom30To31 } from './30_to_31'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

describe('migrateFrom30To31', () => {
  it('removes deprecated chat option fields', () => {
    const result = migrateFrom30To31({
      version: 30,
      chatOptions: {
        includeCurrentFileContent: true,
        enableTools: false,
        maxAutoIterations: 12,
        maxContextMessages: 40,
      },
    })

    expect(result.version).toBe(31)
    if (!isRecord(result.chatOptions)) {
      throw new Error('Expected chatOptions to be an object')
    }

    expect(result.chatOptions.includeCurrentFileContent).toBe(true)
    expect('enableTools' in result.chatOptions).toBe(false)
    expect('maxAutoIterations' in result.chatOptions).toBe(false)
    expect('maxContextMessages' in result.chatOptions).toBe(false)
  })
})
