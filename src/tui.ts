import { exampleCommandDescriptor } from "./extensions/examples/command"
import type { CommandDescriptor, SafetyMetadata } from "./extensions/schema"

type TuiPlaceholderSurface = "tui.route" | "tui.toast" | "tui.fixed-slot"

type TuiFixedSlotName =
  | "app"
  | "home_logo"
  | "home_prompt"
  | "home_prompt_right"
  | "session_prompt"
  | "session_prompt_right"
  | "home_bottom"
  | "home_footer"
  | "sidebar_title"
  | "sidebar_content"
  | "sidebar_footer"

type TuiPlaceholderDescriptorBase = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly surface: TuiPlaceholderSurface
  readonly safety: SafetyMetadata
  readonly experimental: false
}

type TuiRouteDescriptor = TuiPlaceholderDescriptorBase & {
  readonly surface: "tui.route"
  readonly path: string
}

type TuiToastDescriptor = TuiPlaceholderDescriptorBase & {
  readonly surface: "tui.toast"
  readonly severity: "info" | "success" | "warning" | "error"
}

type TuiFixedSlotDescriptor = TuiPlaceholderDescriptorBase & {
  readonly surface: "tui.fixed-slot"
  readonly slot: TuiFixedSlotName
}

const tuiSafePlaceholderSafety: SafetyMetadata = {
  riskLevel: "low",
  touchesFilesystem: false,
  usesNetwork: false,
  requiresConfirmation: false,
  notes: "Descriptor-only placeholder; no TUI behavior is registered here.",
}

export const tuiCommandDescriptors: readonly CommandDescriptor[] = [exampleCommandDescriptor]

export const tuiRouteDescriptors: readonly TuiRouteDescriptor[] = [
  {
    id: "harness.route.context",
    title: "Harness Context Route",
    description: "Placeholder descriptor for a future host-registered TUI route.",
    surface: "tui.route",
    path: "/harness/context",
    safety: tuiSafePlaceholderSafety,
    experimental: false,
  },
]

export const tuiToastDescriptors: readonly TuiToastDescriptor[] = [
  {
    id: "harness.toast.status",
    title: "Harness Status Toast",
    description: "Placeholder descriptor for future TUI toast notifications.",
    surface: "tui.toast",
    severity: "info",
    safety: tuiSafePlaceholderSafety,
    experimental: false,
  },
]

export const tuiFixedSlotDescriptors: readonly TuiFixedSlotDescriptor[] = [
  {
    id: "harness.slot.home-footer",
    title: "Harness Home Footer Slot",
    description: "Placeholder descriptor for the host-defined home_footer TUI slot.",
    surface: "tui.fixed-slot",
    slot: "home_footer",
    safety: tuiSafePlaceholderSafety,
    experimental: false,
  },
]
