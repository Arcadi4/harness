import { access, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  buildLauncherState,
  ensureIsolatedProfile,
  normalizePluginConfig,
  parseLauncherArgs,
} from "../../scripts/dev-opencode-lib"

describe("parseLauncherArgs", () => {
  it("uses isolated local directory install by default", () => {
    expect(parseLauncherArgs([])).toEqual({
      installTarball: false,
      noLaunch: false,
      profileDir: null,
      runMessage: "",
      useGlobal: false,
    })
  })

  it("parses explicit launcher options", () => {
    expect(
      parseLauncherArgs([
        "--global",
        "--profile-dir",
        "/tmp/harness-opencode",
        "--install-tarball",
        "--run",
        "verification ping",
        "--no-launch",
      ])
    ).toEqual({
      installTarball: true,
      noLaunch: true,
      profileDir: "/tmp/harness-opencode",
      runMessage: "verification ping",
      useGlobal: true,
    })
  })

  it("rejects missing option values", () => {
    expect(() => parseLauncherArgs(["--profile-dir"])).toThrow("Missing value for --profile-dir")
    expect(() => parseLauncherArgs(["--run"])).toThrow("Missing value for --run")
  })

  it("rejects unknown options", () => {
    expect(() => parseLauncherArgs(["--unexpected"])).toThrow("Unknown option: --unexpected")
  })
})

describe("normalizePluginConfig", () => {
  it("removes stale root and tarball refs while preserving other plugins", () => {
    const source = JSON.stringify({
      plugin: ["/repo/harness", "file:/repo/harness/harness-runtime-0.0.0.tgz", "other-plugin"],
      theme: "dark",
    })

    expect(
      normalizePluginConfig(source, {
        rootDir: "/repo/harness",
        tarballRef: "file:/repo/harness/harness-runtime-0.0.0.tgz",
      })
    ).toEqual({
      changed: true,
      json: '{\n  "plugin": [\n    "other-plugin"\n  ],\n  "theme": "dark"\n}\n',
    })
  })

  it("normalizes missing plugin arrays to an empty plugin list", () => {
    expect(
      normalizePluginConfig(JSON.stringify({ theme: "dark" }), {
        rootDir: "/repo/harness",
        tarballRef: "file:/repo/harness/harness-runtime-0.0.0.tgz",
      })
    ).toEqual({
      changed: false,
      json: '{\n  "theme": "dark",\n  "plugin": []\n}\n',
    })
  })
})

describe("buildLauncherState", () => {
  it("builds isolated profile paths for harness-runtime", () => {
    const state = buildLauncherState({
      installTarball: false,
      packageName: "harness-runtime",
      packageVersion: "0.0.0",
      profileDir: null,
      rootDir: "/repo/harness",
      useGlobal: false,
    })

    expect(state).toMatchObject({
      cacheDir: "/repo/harness/.opencode-dev/cache/opencode",
      configDir: "/repo/harness/.opencode-dev/config/opencode",
      dataDir: "/repo/harness/.opencode-dev/data/opencode",
      pluginRef: "/repo/harness",
      profileDir: "/repo/harness/.opencode-dev",
      rootDir: "/repo/harness",
      tarballName: "harness-runtime-0.0.0.tgz",
      tarballPath: "/repo/harness/harness-runtime-0.0.0.tgz",
      tarballRef: "file:/repo/harness/harness-runtime-0.0.0.tgz",
      useGlobal: false,
    })
    expect(state.env.OPENCODE_CONFIG_DIR).toBe("/repo/harness/.opencode-dev/config/opencode")
    expect(state.env.XDG_CONFIG_HOME).toBe("/repo/harness/.opencode-dev/config")
    expect(state.env.XDG_DATA_HOME).toBe("/repo/harness/.opencode-dev/data")
    expect(state.env.XDG_CACHE_HOME).toBe("/repo/harness/.opencode-dev/cache")
  })

  it("switches to tarball plugin ref when requested", () => {
    const state = buildLauncherState({
      installTarball: true,
      packageName: "harness-runtime",
      packageVersion: "0.0.0",
      profileDir: "/tmp/harness-profile",
      rootDir: "/repo/harness",
      useGlobal: false,
    })

    expect(state.pluginRef).toBe("file:/repo/harness/harness-runtime-0.0.0.tgz")
    expect(state.profileDir).toBe("/tmp/harness-profile")
  })
})

describe("ensureIsolatedProfile", () => {
  it("creates an isolated profile without copying user config or auth files", async () => {
    const root = path.join(tmpdir(), `harness-opencode-${Date.now()}`)
    const home = path.join(root, "home")
    const profileDir = path.join(root, "profile")
    await mkdir(path.join(home, ".config", "opencode"), { recursive: true })
    await mkdir(path.join(home, ".local", "share", "opencode"), { recursive: true })
    await writeFile(path.join(home, ".config", "opencode", "opencode.json"), '{"token":"secret"}')
    await writeFile(
      path.join(home, ".local", "share", "opencode", "auth.json"),
      '{"token":"secret"}'
    )

    const previousHome = process.env.HOME
    process.env.HOME = home

    try {
      const state = buildLauncherState({
        installTarball: false,
        packageName: "harness-runtime",
        packageVersion: "0.0.0",
        profileDir,
        rootDir: path.join(root, "repo"),
        useGlobal: false,
      })

      await ensureIsolatedProfile(state)

      await expect(fileExists(state.configDir)).resolves.toBe(true)
      await expect(fileExists(state.dataDir)).resolves.toBe(true)
      await expect(fileExists(state.cacheDir)).resolves.toBe(true)
      await expect(fileExists(path.join(state.configDir, "opencode.json"))).resolves.toBe(false)
      await expect(fileExists(path.join(state.dataDir, "auth.json"))).resolves.toBe(false)
    } finally {
      if (previousHome === undefined) {
        delete process.env.HOME
      } else {
        process.env.HOME = previousHome
      }
      await rm(root, { force: true, recursive: true })
    }
  })
})

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
