import architectWorkflowPrompt from "../../../portable/prompts/workflow/architect.md" with { type: "text" }
import executorWorkflowPrompt from "../../../portable/prompts/workflow/executor.md" with { type: "text" }
import plannerWorkflowPrompt from "../../../portable/prompts/workflow/planner.md" with { type: "text" }

export const PROMPT_ASSET_IMPORT_STRATEGY = "portable-bun-text-import" as const

export { architectWorkflowPrompt, executorWorkflowPrompt, plannerWorkflowPrompt }
