import { describe, expect, it } from "vitest"

describe("TUI entrypoint", () => {
  it("exports descriptor examples without launching interactive UI", async () => {
    const tuiModule: Record<string, unknown> = await import("../tui")

    const tuiCommandDescriptors = tuiModule.tuiCommandDescriptors
    const tuiRouteDescriptors = tuiModule.tuiRouteDescriptors
    const tuiToastDescriptors = tuiModule.tuiToastDescriptors
    const tuiFixedSlotDescriptors = tuiModule.tuiFixedSlotDescriptors

    expect(tuiCommandDescriptors).toEqual([
      expect.objectContaining({
        kind: "command",
        surface: "tui.command",
      }),
    ])

    expect(tuiRouteDescriptors).toEqual([
      expect.objectContaining({
        id: "arcadia.route.context",
        surface: "tui.route",
        path: "/arcadia/context",
      }),
    ])

    expect(tuiToastDescriptors).toEqual([
      expect.objectContaining({
        id: "arcadia.toast.status",
        surface: "tui.toast",
        severity: "info",
      }),
    ])

    expect(tuiFixedSlotDescriptors).toEqual([
      expect.objectContaining({
        id: "arcadia.slot.home-footer",
        surface: "tui.fixed-slot",
        slot: "home_footer",
      }),
    ])
  })

  it("keeps the TUI module limited to descriptor exports", async () => {
    const tuiModule = await import("../tui")

    expect(Object.keys(tuiModule).sort()).toEqual([
      "tuiCommandDescriptors",
      "tuiFixedSlotDescriptors",
      "tuiRouteDescriptors",
      "tuiToastDescriptors",
    ])
  })
})
