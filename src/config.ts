import { z } from "zod"

export const HarnessPluginConfigSchema = z.object({
  envPrefix: z.string().min(1).default("HARNESS"),
})

export type HarnessPluginConfig = z.infer<typeof HarnessPluginConfigSchema>

export function loadConfig(): HarnessPluginConfig {
  return HarnessPluginConfigSchema.parse({
    envPrefix: "HARNESS",
  })
}