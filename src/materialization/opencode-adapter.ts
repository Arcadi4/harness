export interface OpenCodeAdapter {
  install(): Promise<void>
  uninstall(): Promise<void>
}

export function createOpenCodeAdapter(): OpenCodeAdapter {
  return {
    async install() {},
    async uninstall() {},
  }
}