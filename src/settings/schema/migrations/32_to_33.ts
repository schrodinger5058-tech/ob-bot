import type { SettingMigration } from '../setting.types'

const LEGACY_SAMPLING_PARAM_KEYS = new Set([
  'temperature',
  'top_p',
  'max_tokens',
  'max_output_tokens',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value !== 'string') {
    return undefined
  }
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

const toIntTokenCount = (value: unknown): number | undefined => {
  const parsed = toFiniteNumber(value)
  if (parsed === undefined) {
    return undefined
  }
  const intValue = Math.floor(parsed)
  return intValue >= 1 ? intValue : undefined
}

const migrateLegacySamplingFields = (
  entity: Record<string, unknown>,
): Record<string, unknown> => {
  if (!Array.isArray(entity.customParameters)) {
    return entity
  }

  const nextCustomParameters: unknown[] = []
  for (const item of entity.customParameters) {
    if (!isRecord(item)) {
      nextCustomParameters.push(item)
      continue
    }

    const key =
      typeof item.key === 'string' ? item.key.trim().toLowerCase() : undefined
    if (!key || !LEGACY_SAMPLING_PARAM_KEYS.has(key)) {
      nextCustomParameters.push(item)
      continue
    }

    if (key === 'temperature' && typeof entity.temperature !== 'number') {
      const migrated = toFiniteNumber(item.value)
      if (migrated !== undefined) {
        entity.temperature = migrated
      }
    }

    if (key === 'top_p' && typeof entity.topP !== 'number') {
      const migrated = toFiniteNumber(item.value)
      if (migrated !== undefined) {
        entity.topP = migrated
      }
    }

    if (
      (key === 'max_tokens' || key === 'max_output_tokens') &&
      typeof entity.maxOutputTokens !== 'number'
    ) {
      const migrated = toIntTokenCount(item.value)
      if (migrated !== undefined) {
        entity.maxOutputTokens = migrated
      }
    }
  }

  entity.customParameters = nextCustomParameters
  return entity
}

export const migrateFrom32To33: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 33

  const chatModelsRaw = Array.isArray(newData.chatModels)
    ? newData.chatModels
    : []
  newData.chatModels = chatModelsRaw.map((model) =>
    isRecord(model) ? migrateLegacySamplingFields({ ...model }) : model,
  )

  const assistantsRaw = Array.isArray(newData.assistants)
    ? newData.assistants
    : []
  newData.assistants = assistantsRaw.map((assistant) =>
    isRecord(assistant)
      ? migrateLegacySamplingFields({ ...assistant })
      : assistant,
  )

  return newData
}
