import { describe, expect, it } from "vitest"
import {
  generateOpenCodeDescriptors,
  validateDescriptorCount,
  validateHarnessPrefix,
  validateSafeIds,
  verifyDeterministic,
} from "./opencode-adapter"

describe("opencode-adapter", () => {
  it("generates exactly 15 descriptors", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateDescriptorCount(descriptors)

    expect(result.valid).toBe(true)
    expect(result.actual).toBe(15)
    expect(result.expected).toBe(15)
  })

  it("all descriptors have arcadia- prefix", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateHarnessPrefix(descriptors)

    expect(result.valid).toBe(true)
    expect(result.invalidIds).toEqual([])
  })

  it("all descriptor IDs use safe filename characters", () => {
    const descriptors = generateOpenCodeDescriptors()
    const result = validateSafeIds(descriptors)

    expect(result.valid).toBe(true)
    expect(result.unsafeIds).toEqual([])
  })

  it("generates deterministic output across calls", () => {
    const result = verifyDeterministic()
    expect(result).toBe(true)
  })

  it("descriptor id matches arcadia-{rolename} format", () => {
    const descriptors = generateOpenCodeDescriptors()
    const ids = descriptors.map((d) => d.id)

    expect(ids).toContain("arcadia-architect")
    expect(ids).toContain("arcadia-planner")
    expect(ids).toContain("arcadia-executor")
    expect(ids).toContain("arcadia-agile-high")
    expect(ids).toContain("arcadia-agile-low")
    expect(ids).toContain("arcadia-introspective")
    expect(ids).toContain("arcadia-researcher")
    expect(ids).toContain("arcadia-explorer")
    expect(ids).toContain("arcadia-programmer-low")
    expect(ids).toContain("arcadia-programmer-medium")
    expect(ids).toContain("arcadia-programmer-high")
    expect(ids).toContain("arcadia-multi-modal-assistant")
    expect(ids).toContain("arcadia-reviewer")
    expect(ids).toContain("arcadia-tester")
    expect(ids).toContain("arcadia-documentation")
  })

  it("includes roleId from original manifest", () => {
    const descriptors = generateOpenCodeDescriptors()
    const architect = descriptors.find((d) => d.id === "arcadia-architect")

    expect(architect?.roleId).toBe("role:architect")
  })

  it("includes recommendations as metadata, not enforcement", () => {
    const descriptors = generateOpenCodeDescriptors()
    const architect = descriptors.find((d) => d.id === "arcadia-architect")

    expect(architect?.recommendations).toBeDefined()
    expect(architect?.recommendations?.skills).toContain("brainstorming")
    expect(architect?.recommendations?.tools).toContain("read")
  })

  it("maps correct categories (6 primary, 9 subagent)", () => {
    const descriptors = generateOpenCodeDescriptors()
    const primaries = descriptors.filter((d) => d.category === "primary")
    const subagents = descriptors.filter((d) => d.category === "subagent")

    expect(primaries.length).toBe(6)
    expect(subagents.length).toBe(9)
  })

  it("source includes hash for tracking", () => {
    const descriptors = generateOpenCodeDescriptors()
    const architect = descriptors.find((d) => d.id === "arcadia-architect")

    expect(architect?.source?.hash).toBeDefined()
    expect(architect?.source?.sourceRole).toBe("architect")
    expect(architect?.source?.managedMarker).toBe("<!-- MANAGED BY HARNESS -->")
  })
})
