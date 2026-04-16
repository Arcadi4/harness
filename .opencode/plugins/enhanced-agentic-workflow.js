const FORK_BOMB_PATTERN = /:\(\)\s*\{\s*:\|:&\s*;\s*\}:\s*;?/

const defaultOptions = {
  workflowTag: "enhanced-agentic-workflow",
  blockedCommandPatterns: [
    /\brm\s+-rf\s+\/(?:\s|$)/i,
    /\bmkfs(?:\.[\w-]+)?(?:\s|$)/i,
    FORK_BOMB_PATTERN,
  ],
  injectEnv: {},
  extraCompactionContext: [],
  onEvent: undefined,
  shouldBlockCommand: undefined,
  buildCompactionContext: undefined,
}

const mergeOptions = (overrides = {}) => ({
  ...defaultOptions,
  ...overrides,
  blockedCommandPatterns: overrides.blockedCommandPatterns ?? defaultOptions.blockedCommandPatterns,
  injectEnv: overrides.injectEnv ?? defaultOptions.injectEnv,
  extraCompactionContext: overrides.extraCompactionContext ?? defaultOptions.extraCompactionContext,
})

const matchesBlockedPattern = (command, pattern) => {
  if (pattern instanceof RegExp) {
    return pattern.test(command)
  }

  if (typeof pattern === "string") {
    const normalizedCommand = command.trim().replace(/\s+/g, " ").toLowerCase()
    const normalizedPattern = pattern.trim().replace(/\s+/g, " ").toLowerCase()
    return normalizedPattern.length > 0 && normalizedCommand.includes(normalizedPattern)
  }

  return false
}

export const createEnhancedAgenticWorkflowPlugin = (pluginOptions = {}) => {
  const options = mergeOptions(pluginOptions)

  return async ({ client, directory, worktree }) => {
    const tryLog = async (level, message, extra = {}) => {
      if (!client?.app?.log) return
      await client.app.log({
        body: {
          service: "enhanced-agentic-workflow",
          level,
          message,
          extra,
        },
      })
    }

    return {
      event: async ({ event }) => {
        if (typeof options.onEvent === "function") {
          await options.onEvent(event, { directory, worktree, client, options })
        }
      },

      "shell.env": async (_input, output) => {
        output.env.OPENCODE_WORKFLOW_TAG = options.workflowTag
        output.env.OPENCODE_WORKTREE = worktree
        output.env.OPENCODE_DIRECTORY = directory

        for (const [key, value] of Object.entries(options.injectEnv)) {
          output.env[key] = String(value)
        }
      },

      "tool.execute.before": async (input) => {
        if (input.tool !== "bash") return

        const command = String(input?.arguments?.command ?? "")
        const matchedPattern = options.blockedCommandPatterns.find((pattern) => matchesBlockedPattern(command, pattern))
        if (matchedPattern) {
          throw new Error(
            `Command blocked by enhanced agentic workflow pattern policy: ${String(matchedPattern)} (command: ${command})`,
          )
        }

        if (typeof options.shouldBlockCommand === "function") {
          const shouldBlock = await options.shouldBlockCommand(command, input, { directory, worktree, client, options })
          if (shouldBlock) {
            throw new Error(`Command blocked by enhanced agentic workflow custom policy (command: ${command})`)
          }
        }
      },

      "experimental.session.compacting": async (input, output) => {
        if (typeof options.buildCompactionContext === "function") {
          const customContext = await options.buildCompactionContext(input, { directory, worktree, client, options })
          if (typeof customContext === "string" && customContext.trim().length > 0) {
            output.context.push(customContext)
          }
          return
        }

        const extra = options.extraCompactionContext
          .filter((item) => typeof item === "string" && item.trim().length > 0)
          .map((item) => `- ${item}`)
          .join("\n")

        output.context.push(
          [
            "",
            "## Enhanced Agentic Workflow State",
            `- Workflow tag: ${options.workflowTag}`,
            `- Worktree: ${worktree}`,
            `- Directory: ${directory}`,
            ...(extra ? [extra] : []),
            "",
          ].join("\n"),
        )
      },

      "session.idle": async () => {
        await tryLog("info", "Session reached idle state", {
          workflowTag: options.workflowTag,
          directory,
          worktree,
        })
      },
    }
  }
}

export const EnhancedAgenticWorkflowPlugin = createEnhancedAgenticWorkflowPlugin()
