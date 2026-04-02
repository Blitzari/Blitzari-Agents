import { z } from "zod"

/**
 * Schema for scheduling a new task via Typeform submission.
 */
export const TaskFormSchema = z.object({
  taskName: z.string().min(3).max(100),
  taskType: z.enum(["anomalyScan", "tokenAnalytics", "whaleMonitor"]),
  description: z.string().max(250).optional(),
  parameters: z
    .record(z.string(), z.string())
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "Parameters must include at least one key",
    }),
  scheduleCron: z
    .string()
    .regex(
      /^(\*|[0-5]?\d)\s+(\*|[01]?\d|2[0-3])\s+(\*|[1-9]|[12]\d|3[01])\s+(\*|[1-9]|1[0-2])\s+(\*|[0-6])$/,
      "Invalid cron expression"
    ),
  enabled: z.boolean().default(true),
})

export type TaskFormInput = z.infer<typeof TaskFormSchema>
