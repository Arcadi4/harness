import { describe, expect, it } from "vitest"
import {
  generateOpenCodeDescriptors,
  validateSafeIds,
  verifyDeterministic,
} from "./opencode-adapter"

describe("opencode-adapter", () => {
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
})
