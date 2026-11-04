import type { SettingMigration } from '../setting.types'

export const migrateFrom30To31: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 31

  const chatOptionsRecord =
    newData.chatOptions && typeof newData.chatOptions === 'object'
      ? { ...(newData.chatOptions as Record<string, unknown>) }
      : {}

  delete chatOptionsRecord.enableTools
  delete chatOptionsRecord.maxAutoIterations
  delete chatOptionsRecord.maxContextMessages

  newData.chatOptions = chatOptionsRecord

  return newData
}
