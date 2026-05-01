import { constants } from "node:fs"
import { access } from "node:fs/promises"
import path from "node:path"

const DEFAULT_SUBMODULE_PATH = "vendor/opencode-dynamic-context-pruning"
const DEFAULT_PINNED_TAG = "v3.1.9"
const DIST_ENTRYPOINT = "dist/index.js"

export type DCPBuildStatus =
  | {
      path: string
      status: "available"
    }
  | {
      message: string
      severity: "warning"
      status: "unavailable"
    }

export type EnsureDCPBuildOptions = {
  pinnedTag?: string
  rootDir?: string
  submodulePath?: string
}

export async function ensureDCPBuild(
  options: EnsureDCPBuildOptions = {},
): Promise<DCPBuildStatus> {
  const rootDir = options.rootDir ?? process.cwd()
  const submodulePath = options.submodulePath ?? DEFAULT_SUBMODULE_PATH
  const pinnedTag = options.pinnedTag ?? DEFAULT_PINNED_TAG
  const absoluteSubmodulePath = path.resolve(rootDir, submodulePath)
  const entrypointPath = path.join(absoluteSubmodulePath, DIST_ENTRYPOINT)

  if (!(await pathExists(absoluteSubmodulePath))) {
    return unavailable(`DCP submodule is missing at ${submodulePath}`)
  }

  const tag = await getExactTag(absoluteSubmodulePath)
  if (!tag.ok) {
    return unavailable(`Unable to verify DCP submodule tag: ${tag.message}`)
  }

  if (tag.value !== pinnedTag) {
    return unavailable(
      `DCP submodule tag mismatch: expected ${pinnedTag}, found ${tag.value}`,
    )
  }

  if (await pathExists(entrypointPath)) {
    return { path: entrypointPath, status: "available" }
  }

  const installResult = await runCommand(["npm", "install"], absoluteSubmodulePath)
  if (!installResult.ok) {
    return unavailable(`DCP dependency install failed: ${installResult.message}`)
  }

  const buildResult = await runCommand(["npm", "run", "build"], absoluteSubmodulePath)
  if (!buildResult.ok) {
    return unavailable(`DCP build failed: ${buildResult.message}`)
  }

  if (!(await pathExists(entrypointPath))) {
    return unavailable(`DCP build completed but ${DIST_ENTRYPOINT} was not created`)
  }

  return { path: entrypointPath, status: "available" }
}

async function getExactTag(
  cwd: string,
): Promise<{ ok: true; value: string } | { message: string; ok: false }> {
  const result = await runCommand(["git", "describe", "--tags", "--exact-match", "HEAD"], cwd)
  if (!result.ok) return result
  const tag = result.stdout.trim()

  return tag ? { ok: true, value: tag } : { message: "git returned an empty tag", ok: false }
}

async function runCommand(
  command: string[],
  cwd: string,
): Promise<{ ok: true; stdout: string } | { message: string; ok: false }> {
  try {
    const child = Bun.spawn(command, {
      cwd,
      stderr: "pipe",
      stdout: "pipe",
    })

    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ])

    if (exitCode === 0) return { ok: true, stdout }

    const output = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n")
    return {
      message: `Command failed (${exitCode}): ${command.join(" ")}${output ? `\n${output}` : ""}`,
      ok: false,
    }
  } catch (error) {
    return {
      message: `Command failed to start: ${command.join(" ")} (${formatError(error)})`,
      ok: false,
    }
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function unavailable(message: string): DCPBuildStatus {
  return { message, severity: "warning", status: "unavailable" }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
