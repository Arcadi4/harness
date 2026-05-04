import type { PluginInput } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"
import { readdir, readFile, stat } from "node:fs/promises"
import { join, relative, resolve } from "node:path"

import type { ModusPluginConfig } from "../config"

const EXEC_COMMAND = "exec"
const PLAN_DIRECTORY = ".modus/plans"
const CURRENT_PLAN_POINTER = ".modus/current-plan"

export type CommandHookContext = {
  input: PluginInput
  config: ModusPluginConfig
}

export interface ExecPlanResolution {
  readonly planPath: string
  readonly source: "argument" | "current-plan" | "newest"
}

export function createCommandHook(context: CommandHookContext) {
  return {
    "command.execute.before": async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Part[] }
    ) => {
      if (input.command !== EXEC_COMMAND) {
        return
      }

      const resolution = await resolveExecPlanPath(context, input.arguments)
      output.parts = [{ type: "text", text: buildExecutorPrompt(resolution) } as Part]
    },
  }
}

export async function resolveExecPlanPath(
  context: Pick<CommandHookContext, "input">,
  argument?: string
): Promise<ExecPlanResolution> {
  const candidate = argument?.trim()
  if (candidate) {
    return {
      planPath: await requirePlanFile(context, candidate, `Plan not found for /exec: ${candidate}`),
      source: "argument",
    }
  }

  const pointerPath = workspacePath(context, CURRENT_PLAN_POINTER)
  if (await isFile(pointerPath)) {
    const pointer = (await readFile(pointerPath, "utf8")).trim()
    if (!pointer) {
      throw new Error(`No plan provided and ${CURRENT_PLAN_POINTER} is empty. Usage: /exec .modus/plans/<plan>.md`)
    }
    return {
      planPath: await requirePlanFile(context, pointer, `${CURRENT_PLAN_POINTER} points to a missing plan: ${pointer}`),
      source: "current-plan",
    }
  }

  const newest = await newestPlanFile(context)
  if (newest) {
    return { planPath: newest, source: "newest" }
  }

  throw new Error(
    `No executable plan found. Usage: /exec .modus/plans/<plan>.md, or create ${CURRENT_PLAN_POINTER} containing a plan path.`
  )
}

function buildExecutorPrompt(resolution: ExecPlanResolution): string {
  return [
    `Execute the Modus plan at ${resolution.planPath}.`,
    `Plan resolution source: ${resolution.source}.`,
    "Call read_plan with this exact planPath first, then execute only tasks from that plan.",
    "Follow the Executor protocol: delegate non-trivial work, verify each unit, save evidence, and update_progress with evidence before marking tasks complete.",
  ].join("\n")
}

async function newestPlanFile(context: Pick<CommandHookContext, "input">): Promise<string | undefined> {
  const root = workspacePath(context, PLAN_DIRECTORY)
  let entries: string[]
  try {
    entries = await readdir(root)
  } catch {
    return undefined
  }

  const plans = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".md"))
      .map(async (entry) => {
        const path = join(root, entry)
        const stats = await stat(path)
        return stats.isFile() ? { path, mtimeMs: stats.mtimeMs } : undefined
      })
  )
  const files = plans.filter((plan): plan is { path: string; mtimeMs: number } => plan !== undefined)

  if (files.length === 0) {
    return undefined
  }

  files.sort((left, right) => right.mtimeMs - left.mtimeMs)
  const newest = files[0]
  const next = files[1]
  if (!newest) {
    return undefined
  }
  if (next && next.mtimeMs === newest.mtimeMs) {
    const relativePaths = files.map((file) => relative(workspaceRoot(context), file.path)).join(", ")
    throw new Error(`Ambiguous default plan; multiple plans share newest mtime. Use /exec <plan-path>. Candidates: ${relativePaths}`)
  }
  return newest.path
}

async function requirePlanFile(
  context: Pick<CommandHookContext, "input">,
  candidate: string,
  message: string
): Promise<string> {
  const planPath = workspacePath(context, candidate)
  if (!(await isFile(planPath))) {
    throw new Error(`${message}. Usage: /exec .modus/plans/<plan>.md`)
  }
  return planPath
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

function workspacePath(context: Pick<CommandHookContext, "input">, candidate: string): string {
  return resolve(workspaceRoot(context), candidate)
}

function workspaceRoot(context: Pick<CommandHookContext, "input">): string {
  return resolve(context.input.worktree || context.input.directory)
}
