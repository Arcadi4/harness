import { describe, expect, it } from "bun:test"

import {
  createExtensionRegistry,
  type CommandDescriptor,
  type HookDescriptor,
  type ToolDescriptor,
} from "./index"

describe("extension descriptors", () => {
  it("registers descriptors in memory by kind and id", () => {
    const registry = createExtensionRegistry()
    const command = createCommandDescriptor("test.command")
    const tool = createToolDescriptor("test.tool")
    const hook = createHookDescriptor("test.hook")

    registry.register(command)
    registry.register(tool)
    registry.register(hook)

    expect(registry.commands.get(command.id)).toMatchObject({ id: command.id, kind: "command" })
    expect(registry.tools.get(tool.id)).toMatchObject({ id: tool.id, kind: "tool" })
    expect(registry.hooks.get(hook.id)).toMatchObject({ id: hook.id, kind: "hook" })
    expect(registry.list().map((descriptor) => descriptor.id)).toEqual([command.id, tool.id, hook.id])
  })
})

function createCommandDescriptor(id: string): CommandDescriptor {
  return {
    id,
    title: "Test command",
    description: "Runs a test command.",
    kind: "command",
    surface: "tui.command",
    command: { name: id, usage: id },
    safety: createSafetyMetadata(),
    experimental: false,
  }
}

function createToolDescriptor(id: string): ToolDescriptor {
  return {
    id,
    title: "Test tool",
    description: "Runs a test tool.",
    kind: "tool",
    surface: "tool",
    tool: { name: id },
    safety: createSafetyMetadata(),
    experimental: false,
  }
}

function createHookDescriptor(id: string): HookDescriptor {
  return {
    id,
    title: "Test hook",
    description: "Runs a test hook.",
    kind: "hook",
    surface: "chat.message",
    hook: { name: "chat.message" },
    safety: createSafetyMetadata(),
    experimental: false,
  }
}

function createSafetyMetadata() {
  return {
    riskLevel: "low" as const,
    touchesFilesystem: false,
    usesNetwork: false,
    requiresConfirmation: false,
  }
}
