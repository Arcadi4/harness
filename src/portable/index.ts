import installComponentsManifest from "../../portable/manifests/install-components.json" with { type: "json" }
import installModulesManifest from "../../portable/manifests/install-modules.json" with { type: "json" }
import installProfilesManifest from "../../portable/manifests/install-profiles.json" with { type: "json" }
import primaryRoleManifestInputs from "../../portable/roles/primary.json" with { type: "json" }
import subagentRoleManifestInputs from "../../portable/roles/subagents.json" with { type: "json" }

import { validatePortableInstallManifestSet } from "../core"
import { RoleManifestSchema } from "../roles/schema"

export const portablePrimaryRoleManifests = primaryRoleManifestInputs.map((manifest) =>
  RoleManifestSchema.parse(manifest)
)

export const portableSubagentRoleManifests = subagentRoleManifestInputs.map((manifest) =>
  RoleManifestSchema.parse(manifest)
)

export const portableRoleManifests = [
  ...portablePrimaryRoleManifests,
  ...portableSubagentRoleManifests,
] as const

export const portableInstallManifests = validatePortableInstallManifestSet({
  modules: installModulesManifest,
  components: installComponentsManifest,
  profiles: installProfilesManifest,
})

export const installModules = portableInstallManifests.modules
export const installComponents = portableInstallManifests.components
export const installProfiles = portableInstallManifests.profiles

export type {
  InstallComponent,
  InstallComponentsManifest,
  InstallModule,
  InstallModulesManifest,
  InstallProfile,
  InstallProfilesManifest,
  PortableInstallManifestSet,
} from "../core"
