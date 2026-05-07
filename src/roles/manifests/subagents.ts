import subagentRoleManifestInputs from "../../../portable/roles/subagents.json" with { type: "json" }
import { defineRoleManifest } from "../schema"

export const subagentRoleManifests = subagentRoleManifestInputs.map((manifest) =>
  defineRoleManifest(manifest)
)

export const [
  researcherManifest,
  explorerManifest,
  programmerLowManifest,
  programmerMediumManifest,
  programmerHighManifest,
  multiModalAssistantManifest,
  reviewerManifest,
  testerManifest,
  documentationManifest,
] = subagentRoleManifests
