import { parseCustomParameterValue } from './custom-parameters'

describe('parseCustomParameterValue', () => {
  it('parses legacy numeric sampling fields without explicit type', () => {
    expect(parseCustomParameterValue('0.8', undefined, 'temperature')).toBe(0.8)
    expect(parseCustomParameterValue('0,8', undefined, 'temperature')).toBe(0.8)
    expect(parseCustomParameterValue('1024', undefined, 'max_tokens')).toBe(
      1024,
    )
  })

  it('parses comma decimals for explicit number type', () => {
    expect(parseCustomParameterValue('0,25', 'number', 'foo')).toBe(0.25)
  })

  it('keeps explicit text type as text for reserved keys', () => {
    expect(parseCustomParameterValue('0.8', 'text', 'temperature')).toBe('0.8')
  })

  it('keeps unknown keys without type as text', () => {
    expect(parseCustomParameterValue('  hello  ', undefined, 'foo')).toBe(
      'hello',
    )
  })
})
