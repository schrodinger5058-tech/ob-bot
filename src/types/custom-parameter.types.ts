import { z } from 'zod'

export const customParameterTypeSchema = z.enum([
  'text',
  'number',
  'boolean',
  'json',
])

export const customParameterSchema = z.object({
  key: z
    .string({
      required_error: 'custom parameter key is required',
    })
    .min(1, 'custom parameter key is required'),
  value: z.string().default(''),
  // Optional for backward compatibility with existing saved settings
  type: customParameterTypeSchema.optional(),
})

export type CustomParameterType = z.infer<typeof customParameterTypeSchema>

export type CustomParameter = z.infer<typeof customParameterSchema>
