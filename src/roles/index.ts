import type { RoleName } from "../types/roles"
import { allRoleManifests } from "./manifests"
import { RoleManifestSchema, type RoleManifest } from "./schema"

export * from "./schema"
export * from "./manifests"

export const roleManifestList = allRoleManifests.map((manifest) =>
  RoleManifestSchema.parse(manifest)
) as RoleManifest[]

export const roleManifests = Object.fromEntries(
  roleManifestList.map((manifest) => [manifest.name, manifest])
) as Record<RoleName, RoleManifest>

export function getRoleManifest(roleName: RoleName): RoleManifest {
  return roleManifests[roleName]
}
