import type { DCPBuildStatus } from "./build"
import type { DCPDetectionResult } from "./detector"
import type { DCPInjectionResult } from "./injector"

export type DCPDecisionResult = DCPDetectionResult | DCPBuildStatus | DCPInjectionResult

export function logDCPDecision(result: DCPDecisionResult): void {
  if ("detected" in result) {
    const status = result.detected ? "detected" : "skipped"
    const paths = uniquePaths(
      result.signals
        .map((signal) => signal.path)
        .filter((path): path is string => Boolean(path))
    )
    const pathSuffix = paths.length > 0 ? `: ${paths.join(", ")}` : ""
    const reason = result.reason ? ` — ${result.reason}` : ""
    console.info(`[DCP] ${status}${pathSuffix}${reason}`)
    return
  }

  if (result.status === "available") {
    console.info(`[DCP] detected: build available at ${result.path}`)
    return
  }

  if ("severity" in result) {
    console.warn(`[DCP] warning: ${result.message}`)
    return
  }

  const details = [result.configPath, result.pluginPath].filter(Boolean)
  const detailSuffix = details.length > 0 ? ` (${details.join(", ")})` : ""
  const reason = result.reason ? `: ${result.reason}` : ""
  const logger = result.status === "warning" ? console.warn : console.info
  logger(`[DCP] ${result.status}${detailSuffix}${reason}`)
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)]
}
