export * from "./types"

export type {
  TargetConfig,
  GeneratedFileMeta,
  CollisionPolicy,
  SyncOptions,
  SyncOperation,
  SyncFileResult,
  SyncResult,
} from "./types"

export { syncFiles } from "./sync"
export type { SyncEngine } from "./sync"

export { renderAgentDefinition } from "./renderer"
export type { Renderer } from "./renderer"

export { createOpenCodeAdapter } from "./opencode-adapter"
export type { OpenCodeAdapter } from "./opencode-adapter"