import { describe, expect, it } from "bun:test"
import { join } from "node:path"

import {
  architectWorkflowPrompt,
  plannerWorkflowPrompt,
} from "./index"
import { parsePlanFile } from "../../state/work-plan"

const GOLDEN_PLAN_PATH = join(process.cwd(), ".modus/plans/example-api-rate-limiting.md")

describe("workflow prompt assets", () => {
  it("imports markdown prompts as bundled text", () => {
    expect(typeof architectWorkflowPrompt).toBe("string")
    expect(architectWorkflowPrompt.trim().length).toBeGreaterThan(0)
    expect(typeof plannerWorkflowPrompt).toBe("string")
    expect(plannerWorkflowPrompt.trim().length).toBeGreaterThan(0)
  })
})

describe("Golden plan contract", () => {
  it("stays parseable by plan tooling", async () => {
    const plan = await parsePlanFile(GOLDEN_PLAN_PATH)

    expect(plan.metadata.planId).toBe("plan-api-rate-limiting")
    expect(plan.waves.length).toBeGreaterThan(0)
    expect(plan.waves.some((wave) => wave.tasks.length > 0)).toBe(true)
  })
})
