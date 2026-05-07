import primaryRoleManifestInputs from "../../../portable/roles/primary.json" with { type: "json" }
import { defineRoleManifest } from "../schema"

export const primaryRoleManifests = primaryRoleManifestInputs.map((manifest) =>
  defineRoleManifest(manifest)
)

export const [
  architectManifest,
  plannerManifest,
  executorManifest,
  agileHighManifest,
  agileLowManifest,
  introspectiveManifest,
] = primaryRoleManifests
