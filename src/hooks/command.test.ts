import { afterEach, describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createPluginInterface } from "../plugin-interface"
import { createCommandHook, resolveExecPlanPath, type CommandHookContext } from "./command"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe("/exec command hook", () => {
  it("wires the command hook through the plugin interface", () => {
    const pluginInterface = createPluginInterface(createContext("/tmp/modus"))

    expect(typeof pluginInterface.config).toBe("function")
    expect(typeof pluginInterface["command.execute.before"]).toBe("function")
  })

  it("forwards an explicit plan path to Executor command output", async () => {
    const root = await createWorkspace()
    const planPath = await writePlan(root, "example.md")
    const context = createContext(root)
    const output = { parts: [] as any[] }

    await createCommandHook(context)["command.execute.before"](
      { command: "exec", sessionID: "session-1", arguments: ".modus/plans/example.md" },
      output
    )

    expect(output.parts).toEqual([
      {
        type: "text",
        text: expect.stringContaining(`Execute the Modus plan at ${planPath}.`),
      },
    ])
    expect(output.parts[0].text).toContain("Call read_plan with this exact planPath first")
  })

  it("returns actionable usage when no plan can be resolved", async () => {
    const root = await createWorkspace()
    const context = createContext(root)
    const output = { parts: [] as any[] }

    await expect(
      createCommandHook(context)["command.execute.before"](
        { command: "exec", sessionID: "session-1", arguments: "" },
        output
      )
    ).rejects.toThrow("Usage: /exec .modus/plans/<plan>.md")
  })

  it("resolves default plan from current-plan pointer before newest plan", async () => {
    const root = await createWorkspace()
    const current = await writePlan(root, "current.md")
    await writePlan(root, "newest.md")
    await writeFile(join(root, ".modus/current-plan"), ".modus/plans/current.md", "utf8")

    const resolution = await resolveExecPlanPath(createContext(root), "")

    expect(resolution).toEqual({ planPath: current, source: "current-plan" })
  })

  it("resolves default plan from newest single Markdown plan by mtime", async () => {
    const root = await createWorkspace()
    await writePlan(root, "older.md")
    await new Promise((resolve) => setTimeout(resolve, 5))
    const newest = await writePlan(root, "newest.md")

    const resolution = await resolveExecPlanPath(createContext(root), "")

    expect(resolution).toEqual({ planPath: newest, source: "newest" })
  })
})

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "modus-exec-test-"))
  roots.push(root)
  await mkdir(join(root, ".modus/plans"), { recursive: true })
  return root
}

async function writePlan(root: string, name: string): Promise<string> {
  const planPath = join(root, ".modus/plans", name)
  await writeFile(planPath, `# Plan ${name}\n`, "utf8")
  return planPath
}

function createContext(root: string): CommandHookContext {
  return {
    input: {
      directory: root,
      worktree: root,
      project: { id: "project-1" },
    } as any,
    config: {
      envPrefix: "MODUS_",
    },
  }
}
