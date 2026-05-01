import { existsSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const DCP_PLUGIN_NAME = "@tarquinen/opencode-dcp"
const DCP_CONFIG_FILENAMES = ["dcp.jsonc", "dcp.json"] as const

export type SignalInfo = {
  type: "config" | "logs" | "plugin-registry"
  path?: string
  command?: string
  reason: string
}

export type DCPDetectionResult = {
  detected: boolean
  signals: SignalInfo[]
  reason?: string
}

export type DCPDetectorOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  includePluginRegistry?: boolean
}

export function detectDCP(options: DCPDetectorOptions = {}): DCPDetectionResult {
  const env = options.env ?? process.env
  const cwd = options.cwd ?? process.cwd()
  const signals: SignalInfo[] = []

  addConfigSignals(signals, join(resolveHome(env), ".config", "opencode"), "global OpenCode config")

  const configDir = env.OPENCODE_CONFIG_DIR?.trim()
  if (configDir) {
    addConfigSignals(signals, configDir, "OPENCODE_CONFIG_DIR config")
  }

  addConfigSignals(signals, join(cwd, ".opencode"), "project OpenCode config")
  addLogsSignal(signals, join(resolveHome(env), ".config", "opencode", "logs", "dcp"))

  if (options.includePluginRegistry !== false) {
    addPluginRegistrySignal(signals, env)
  }

  if (signals.length === 0) {
    return {
      detected: false,
      signals,
      reason: "No DCP config, log directory, or plugin registry signal found.",
    }
  }

  return {
    detected: true,
    signals,
    reason: `Detected ${signals.length} DCP signal${signals.length === 1 ? "" : "s"} under any-signal policy.`,
  }
}

function addConfigSignals(signals: SignalInfo[], directory: string, scope: string): void {
  for (const filename of DCP_CONFIG_FILENAMES) {
    const path = join(directory, filename)
    if (existsAsFile(path)) {
      signals.push({
        type: "config",
        path,
        reason: `${scope} contains ${filename}; presence is sufficient under any-signal policy.`,
      })
    }
  }
}

function addLogsSignal(signals: SignalInfo[], path: string): void {
  if (!existsAsDirectory(path)) return

  signals.push({
    type: "logs",
    path,
    reason: "DCP logs directory exists; presence is sufficient under any-signal policy.",
  })
}

function addPluginRegistrySignal(signals: SignalInfo[], env: NodeJS.ProcessEnv): void {
  const command = "opencode plugin list"
  const result = spawnSync("opencode", ["plugin", "list"], {
    env,
    encoding: "utf8",
    shell: false,
    timeout: 1_500,
  })

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  if (!output.includes(DCP_PLUGIN_NAME)) return

  signals.push({
    type: "plugin-registry",
    command,
    reason: `OpenCode plugin list output includes ${DCP_PLUGIN_NAME}; enabled state/version is not rejected under any-signal policy.`,
  })
}

function resolveHome(env: NodeJS.ProcessEnv): string {
  return env.HOME?.trim() || homedir()
}

function existsAsFile(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isFile()
  } catch {
    return false
  }
}

function existsAsDirectory(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isDirectory()
  } catch {
    return false
  }
}
