export const POLICY = {
  maxWorkers: 3,
  maxConcurrency: 1,
  maxHops: 2,
  maxRounds: 1,
} as const

export function routeMentions(text: string, members: string[]): string[] {
  let fence = ''
  const lines: string[] = []
  for (const line of text.split('\n')) {
    const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
    if (mark) {
      if (!fence) fence = mark
      else if (mark[0] === fence[0] && mark.length >= fence.length) fence = ''
      continue
    }
    if (!fence && !line.trimStart().startsWith('>'))
      lines.push(line.replace(/(`+).*?\1/g, ''))
  }
  const ids = [
    ...new Set(
      [...lines.join('\n').matchAll(/(?:^|[^\w@])@([a-z][a-z0-9_-]*)\b/g)].map(
        (m) => m[1],
      ),
    ),
  ]
  if (ids.some((id) => !members.includes(id)))
    throw new Error('obBot.invalidMention')
  return ids
}

export function validatePlan(
  raw: string,
  members: string[],
  lead: string,
): { botId: string; task: string }[] {
  const data = JSON.parse(
    raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, ''),
  ) as { assignments?: unknown }
  if (
    !Array.isArray(data.assignments) ||
    !data.assignments.length ||
    data.assignments.length > POLICY.maxWorkers
  )
    throw new Error('obBot.invalidPlan')
  const seen = new Set<string>()
  return data.assignments.map((item) => {
    const a = item as { botId?: unknown; task?: unknown }
    if (
      !a ||
      typeof a.botId !== 'string' ||
      !members.includes(a.botId) ||
      a.botId === lead ||
      seen.has(a.botId) ||
      typeof a.task !== 'string' ||
      !a.task.trim() ||
      a.task.length > 6000
    )
      throw new Error('obBot.invalidPlan')
    seen.add(a.botId)
    return { botId: a.botId, task: a.task }
  })
}
