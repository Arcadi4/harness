import { describe, expect, it } from "vitest"
import * as server from "./server"

describe("server entrypoint exports", () => {
  it("imports without executing the plugin and exposes the server plugin", () => {
    expect(server).toHaveProperty("createServerPlugin")
    expect(typeof server.createServerPlugin).toBe("function")
    expect(server.default).toBe(server.createServerPlugin)
  })

  it("re-exports server-safe scaffold surfaces", () => {
    expect(server).toMatchObject({
      HarnessPluginConfigSchema: expect.any(Object),
      loadConfig: expect.any(Function),
      roleManifestList: expect.any(Array),
      roleManifests: expect.any(Object),
      getRoleManifest: expect.any(Function),
      buildDirective: expect.any(Function),
      buildPrompt: expect.any(Function),
      buildReminder: expect.any(Function),
      SESSION_STATE_METADATA: expect.objectContaining({ namespace: "harness.session" }),
      BACKGROUND_STATE_METADATA: expect.objectContaining({ namespace: "harness.background" }),
      WORK_PLAN_STATE_METADATA: expect.objectContaining({ namespace: "harness.work-plan" }),
      EVIDENCE_STATE_METADATA: expect.objectContaining({ namespace: "harness.evidence" }),
      createExtensionRegistry: expect.any(Function),
      exampleExtensionDescriptors: expect.any(Array),
    })
  })
})
