import type { HarnessPluginConfig } from "./schema"
import { HarnessPluginConfigSchema } from "./schema"

export function loadConfig(): HarnessPluginConfig {
  const parsed = HarnessPluginConfigSchema.parse({})
  return {
    ...parsed,
    modelCapabilities: parsed.modelCapabilities ?? {
      supportsStreaming: false,
      supportsTools: false,
      supportsVision: false,
      supportsJsonMode: false,
    },
  }
}
