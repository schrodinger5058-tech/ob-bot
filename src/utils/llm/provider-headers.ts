import { ProviderHeader } from '../../types/provider.types'

export const sanitizeProviderHeaders = (
  headers: ProviderHeader[] | undefined,
): ProviderHeader[] => {
  if (!headers) return []

  return headers
    .map((header) => ({
      key: header.key.trim(),
      value: header.value,
    }))
    .filter((header) => header.key.length > 0)
}

export const toProviderHeadersRecord = (
  headers: ProviderHeader[] | undefined,
): Record<string, string> | undefined => {
  const sanitized = sanitizeProviderHeaders(headers)
  if (sanitized.length === 0) return undefined

  return Object.fromEntries(
    sanitized.map((header) => [header.key, header.value]),
  )
}
