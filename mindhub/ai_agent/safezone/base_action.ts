import { z } from "zod"

/**
 * Base types for any action.
 */
export type ActionSchema = z.ZodObject<z.ZodRawShape>

export interface ActionResponse<T> {
  notice: string
  data?: T
  meta?: Record<string, unknown>
}

export interface BaseAction<S extends ActionSchema, R, Ctx = unknown> {
  id: string
  summary: string
  input: S
  execute(args: {
    payload: z.infer<S>
    context: Ctx
    signal?: AbortSignal
  }): Promise<ActionResponse<R>>
}

/**
 * Utility to validate raw input against an action schema.
 */
export function validateActionPayload<S extends ActionSchema>(
  schema: S,
  raw: unknown
): z.infer<S> {
  return schema.parse(raw)
}
