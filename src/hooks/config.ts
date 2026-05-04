import type { Config } from "@opencode-ai/plugin"

import { generateWorkflowAgentDescriptors } from "../opencode/opencode-adapter"

/**
 * Default OpenCode agents to remove when this plugin is injected.
 * OpenCode's agent merge logic (state() function) deletes any agent
 * whose config includes `disable: true`.
 *
 * @see https://opencode.ai/docs/agents#agent-merge — §6.5.1
 */
const DEFAULT_OPENCODE_AGENTS = ["general", "plan", "build", "explore"] as const

const EXEC_COMMAND_TEMPLATE = [
  "Execute a Modus plan through the Executor workflow.",
  "The Modus command hook resolves the plan in this order: explicit /exec path, .modus/current-plan pointer, then a single newest Markdown plan in .modus/plans by mtime.",
  "If resolution fails, it returns actionable usage instead of guessing.",
].join("\n")

export function createConfigHook() {
  return async (config: Config): Promise<void> => {
    const agents = (config.agent ??= {})
    const commands = (config.command ??= {})

    commands.exec = {
      template: EXEC_COMMAND_TEMPLATE,
      description: "Execute a Modus plan with the Executor agent. Usage: /exec [plan-path]",
      agent: "executor",
    }

    for (const name of DEFAULT_OPENCODE_AGENTS) {
      const agent = agents[name]

      if (agent === undefined) {
        agents[name] = { disable: true }
        continue
      }

      if (typeof agent === "object") {
        agent.disable = true
        continue
      }

      agents[name] = { disable: true }
    }

    for (const descriptor of generateWorkflowAgentDescriptors()) {
      const agentName = descriptor.id.replace(/^workflow-/, "")
      const existing = agents[agentName]
      const existingConfig = typeof existing === "object" && existing !== null ? existing : {}

      agents[agentName] = {
        ...existingConfig,
        description: descriptor.description,
        mode: descriptor.category,
        prompt: descriptor.prompt,
      }
    }
  }
}
