import { describe, expect, it } from "vitest"

import {
  RoleManifestSchema,
  roleManifests,
  roleManifestList,
  getRoleManifest,
  buildPrompt,
  buildDirective,
  buildReminder,
  createExtensionRegistry,
  ExtensionDescriptorSchema,
  exampleCommandDescriptor,
  exampleToolDescriptor,
  exampleHookDescriptor,
} from "./index"

describe("registry exports", () => {
  it("exports all role manifest functions", () => {
    expect(RoleManifestSchema).toBeDefined()
    expect(roleManifests).toBeDefined()
    expect(roleManifestList).toBeDefined()
    expect(getRoleManifest).toBeDefined()
  })

  it("exports all prompt builders", () => {
    expect(buildPrompt).toBeDefined()
    expect(buildDirective).toBeDefined()
    expect(buildReminder).toBeDefined()
  })

  it("exports all extension registry functions", () => {
    expect(createExtensionRegistry).toBeDefined()
    expect(ExtensionDescriptorSchema).toBeDefined()
    expect(exampleCommandDescriptor).toBeDefined()
    expect(exampleToolDescriptor).toBeDefined()
    expect(exampleHookDescriptor).toBeDefined()
  })

  it("provides working role manifest lookup", () => {
    const roleNames = Object.keys(roleManifests)
    expect(roleNames.length).toBeGreaterThan(0)

    for (const name of roleNames) {
      const manifest = getRoleManifest(name as keyof typeof roleManifests)
      expect(manifest).toBeDefined()
      expect(manifest.name).toBe(name)
    }
  })

  it("provides working extension registry", () => {
    const registry = createExtensionRegistry()

    registry.register(exampleCommandDescriptor)
    registry.register(exampleToolDescriptor)
    registry.register(exampleHookDescriptor)

    expect(registry.list().length).toBe(3)
    expect(registry.commands.get(exampleCommandDescriptor.id)).toEqual(exampleCommandDescriptor)
    expect(registry.tools.get(exampleToolDescriptor.id)).toEqual(exampleToolDescriptor)
    expect(registry.hooks.get(exampleHookDescriptor.id)).toEqual(exampleHookDescriptor)
  })
})
