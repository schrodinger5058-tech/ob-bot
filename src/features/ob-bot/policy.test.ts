import { routeMentions, validatePlan } from './policy'

describe('group routing and delegation boundaries', () => {
  it('routes distinct member mentions and ignores code, quotes and email', () => {
    expect(
      routeMentions('@alice @alice email@bob\n> @bob\n`@bob`\n```\n@bob\n```', [
        'alice',
        'bob',
      ]),
    ).toEqual(['alice'])
    expect(() => routeMentions('@outsider', ['alice'])).toThrow(
      'obBot.invalidMention',
    )
  })
  it('accepts a fenced plan but rejects lead, outsiders, duplicates and excess workers', () => {
    expect(
      validatePlan(
        '```json\n{"assignments":[{"botId":"a","task":"read"}]}\n```',
        ['lead', 'a'],
        'lead',
      ),
    ).toEqual([{ botId: 'a', task: 'read' }])
    for (const assignments of [
      [],
      [{ botId: 'lead', task: 'x' }],
      [{ botId: 'b', task: 'x' }],
      [
        { botId: 'a', task: 'x' },
        { botId: 'a', task: 'y' },
      ],
      [null],
      Array(4).fill({ botId: 'a', task: 'x' }),
    ]) {
      expect(() =>
        validatePlan(JSON.stringify({ assignments }), ['lead', 'a'], 'lead'),
      ).toThrow()
    }
  })
})
