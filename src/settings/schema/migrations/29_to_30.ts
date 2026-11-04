import type { SettingMigration } from '../setting.types'

export const migrateFrom29To30: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 30

  const skillsRecord =
    newData.skills && typeof newData.skills === 'object'
      ? (newData.skills as Record<string, unknown>)
      : {}
  const disabledSkillIds = Array.isArray(skillsRecord.disabledSkillIds)
    ? skillsRecord.disabledSkillIds.filter(
        (item): item is string => typeof item === 'string',
      )
    : []

  newData.skills = {
    ...skillsRecord,
    disabledSkillIds,
  }

  const assistantsRaw = Array.isArray(newData.assistants)
    ? newData.assistants
    : []
  newData.assistants = assistantsRaw.map((assistant) => {
    if (!assistant || typeof assistant !== 'object') {
      return assistant
    }

    const record = assistant as Record<string, unknown>
    const existingSkillPreferences =
      record.skillPreferences && typeof record.skillPreferences === 'object'
        ? (record.skillPreferences as Record<string, unknown>)
        : {}

    const legacyEnabledSkills = Array.isArray(record.enabledSkills)
      ? record.enabledSkills.filter(
          (item): item is string => typeof item === 'string',
        )
      : []

    const nextSkillPreferences: Record<string, unknown> = {
      ...existingSkillPreferences,
    }

    for (const skillId of legacyEnabledSkills) {
      const existingPref = nextSkillPreferences[skillId]
      if (existingPref && typeof existingPref === 'object') {
        continue
      }
      nextSkillPreferences[skillId] = {
        enabled: true,
        loadMode: 'lazy',
      }
    }

    return {
      ...record,
      skillPreferences: nextSkillPreferences,
    }
  })

  return newData
}
