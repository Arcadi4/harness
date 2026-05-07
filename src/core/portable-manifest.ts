import { z } from "zod"

export const PortableTargetSchema = z.enum(["opencode", "codex", "claude", "cursor"])
export const PortableCostSchema = z.enum(["light", "medium", "heavy"])
export const PortableStabilitySchema = z.enum(["stable", "beta", "experimental"])

const PortableIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9:-]*$/)

export const InstallModuleSchema = z.object({
  id: PortableIdSchema,
  kind: z.string().min(1),
  description: z.string().min(1),
  paths: z.array(z.string().min(1)).min(1),
  targets: z.array(PortableTargetSchema).min(1),
  dependencies: z.array(PortableIdSchema).default([]),
  defaultInstall: z.boolean(),
  cost: PortableCostSchema,
  stability: PortableStabilitySchema,
})

export const InstallModulesManifestSchema = z
  .object({
    version: z.literal(1),
    modules: z.array(InstallModuleSchema).min(1),
  })
  .superRefine((manifest, context) => {
    assertUniqueIds(manifest.modules, "modules", context)
    const ids = new Set(manifest.modules.map((module) => module.id))

    for (const [moduleIndex, module] of manifest.modules.entries()) {
      for (const [dependencyIndex, dependency] of module.dependencies.entries()) {
        if (!ids.has(dependency)) {
          context.addIssue({
            code: "custom",
            message: `Unknown module dependency: ${dependency}`,
            path: ["modules", moduleIndex, "dependencies", dependencyIndex],
          })
        }
      }
    }
  })

export const InstallComponentSchema = z.object({
  id: PortableIdSchema,
  family: z.string().min(1),
  description: z.string().min(1),
  modules: z.array(PortableIdSchema).min(1),
})

export const InstallComponentsManifestSchema = z
  .object({
    version: z.literal(1),
    components: z.array(InstallComponentSchema).min(1),
  })
  .superRefine((manifest, context) => {
    assertUniqueIds(manifest.components, "components", context)
  })

export const InstallProfileSchema = z.object({
  description: z.string().min(1),
  modules: z.array(PortableIdSchema).min(1),
})

export const InstallProfilesManifestSchema = z.object({
  version: z.literal(1),
  profiles: z.record(PortableIdSchema, InstallProfileSchema),
})

export interface PortableInstallManifestSetInput {
  modules: unknown
  components: unknown
  profiles: unknown
}

export interface PortableInstallManifestSet {
  modules: InstallModulesManifest
  components: InstallComponentsManifest
  profiles: InstallProfilesManifest
}

export function validatePortableInstallManifestSet(
  input: PortableInstallManifestSetInput,
  options: { pathExists?: (path: string) => boolean } = {}
): PortableInstallManifestSet {
  const modules = InstallModulesManifestSchema.parse(input.modules)
  const components = InstallComponentsManifestSchema.parse(input.components)
  const profiles = InstallProfilesManifestSchema.parse(input.profiles)
  const moduleIds = new Set(modules.modules.map((module) => module.id))

  for (const component of components.components) {
    for (const moduleId of component.modules) {
      if (!moduleIds.has(moduleId)) {
        throw new Error(`Component ${component.id} references unknown module: ${moduleId}`)
      }
    }
  }

  for (const [profileId, profile] of Object.entries(profiles.profiles)) {
    for (const moduleId of profile.modules) {
      if (!moduleIds.has(moduleId)) {
        throw new Error(`Profile ${profileId} references unknown module: ${moduleId}`)
      }
    }
  }

  if (options.pathExists) {
    for (const module of modules.modules) {
      for (const modulePath of module.paths) {
        if (!options.pathExists(modulePath)) {
          throw new Error(`Module ${module.id} references missing path: ${modulePath}`)
        }
      }
    }
  }

  return { modules, components, profiles }
}

type IdBearing = { id: string }

function assertUniqueIds(
  records: readonly IdBearing[],
  collectionName: string,
  context: z.RefinementCtx
): void {
  const seen = new Set<string>()

  for (const [index, record] of records.entries()) {
    if (seen.has(record.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate ${collectionName} id: ${record.id}`,
        path: [collectionName, index, "id"],
      })
    }
    seen.add(record.id)
  }
}

export type PortableTarget = z.infer<typeof PortableTargetSchema>
export type InstallModule = z.infer<typeof InstallModuleSchema>
export type InstallModulesManifest = z.infer<typeof InstallModulesManifestSchema>
export type InstallComponent = z.infer<typeof InstallComponentSchema>
export type InstallComponentsManifest = z.infer<typeof InstallComponentsManifestSchema>
export type InstallProfile = z.infer<typeof InstallProfileSchema>
export type InstallProfilesManifest = z.infer<typeof InstallProfilesManifestSchema>
