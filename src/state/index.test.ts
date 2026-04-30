import { describe, expect, it } from "vitest"

import {
  BACKGROUND_STATE_METADATA,
  EVIDENCE_STATE_METADATA,
  SESSION_STATE_METADATA,
  WORK_PLAN_STATE_METADATA,
  serializeActiveWorkState,
  serializeBackgroundTaskHandle,
  serializeEvidenceReference,
  serializeSessionRecord,
} from "./index"
import { createEvidenceId, createSessionId, createTaskId } from "../types/ids"
import type {
  ActiveWorkState,
  BackgroundTaskHandle,
  CancellationRequest,
  EvidenceReference,
  ResumeToken,
  SessionRecord,
  TaskProgress,
  WorkPlan,
} from "./index"

describe("state type surfaces", () => {
  it("exports versioned, namespaced metadata with bounded polling limits", () => {
    expect(WORK_PLAN_STATE_METADATA.namespace).toBe("harness.work-plan")
    expect(SESSION_STATE_METADATA.namespace).toBe("harness.session")
    expect(BACKGROUND_STATE_METADATA.namespace).toBe("harness.background")
    expect(EVIDENCE_STATE_METADATA.namespace).toBe("harness.evidence")
    expect(BACKGROUND_STATE_METADATA.maxPollingIntervalMs).toBeGreaterThan(0)
    expect(BACKGROUND_STATE_METADATA.staleDetectionThresholdMs).toBeGreaterThan(
      BACKGROUND_STATE_METADATA.maxPollingIntervalMs
    )
    expect(BACKGROUND_STATE_METADATA.userVisibleNotices.stale).toContain("stale")
  })

  it("models task progress as a discriminated union", () => {
    const pending: TaskProgress = {
      status: "pending",
      taskId: createTaskId("task-1"),
      title: "Define state",
    }
    const inProgress: TaskProgress = {
      status: "in_progress",
      taskId: createTaskId("task-2"),
      title: "Implement types",
      startedAt: "2026-04-28T00:00:00.000Z",
      evidenceIds: [createEvidenceId("evidence-1")],
    }
    const completed: TaskProgress = {
      status: "completed",
      taskId: createTaskId("task-3"),
      title: "Verify",
      startedAt: "2026-04-28T00:00:00.000Z",
      completedAt: "2026-04-28T00:01:00.000Z",
      evidenceIds: [createEvidenceId("evidence-2")],
    }
    const cancelled: TaskProgress = {
      status: "cancelled",
      taskId: createTaskId("task-4"),
      title: "Stop",
      cancelledAt: "2026-04-28T00:02:00.000Z",
      cancellationReason: "superseded",
    }

    expect([pending.status, inProgress.status, completed.status, cancelled.status]).toEqual([
      "pending",
      "in_progress",
      "completed",
      "cancelled",
    ])
  })

  it("serializes active work, session, background, and evidence state without runtime loops", () => {
    const plan: WorkPlan = {
      version: 1,
      namespace: WORK_PLAN_STATE_METADATA.namespace,
      planId: createTaskId("plan-1"),
      title: "Work-state surfaces",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      tasks: [{ status: "pending", taskId: createTaskId("task-1"), title: "Types" }],
    }
    const active: ActiveWorkState = {
      version: 1,
      namespace: WORK_PLAN_STATE_METADATA.namespace,
      activePlan: plan,
      currentTaskId: createTaskId("task-1"),
      sessionId: createSessionId("session-1"),
      notices: ["Polling must remain bounded and user-visible."],
    }
    const session: SessionRecord = {
      version: 1,
      namespace: SESSION_STATE_METADATA.namespace,
      sessionId: createSessionId("session-1"),
      role: "executor",
      status: "active",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:00:00.000Z",
      childSessionIds: [createSessionId("session-2")],
    }
    const cancellation: CancellationRequest = {
      requestedAt: "2026-04-28T00:03:00.000Z",
      requestedBySessionId: createSessionId("session-1"),
      reason: "user_requested",
      userVisibleNotice: "Cancellation requested by user.",
    }
    const resumeToken: ResumeToken = {
      token: "resume-token-1",
      issuedAt: "2026-04-28T00:04:00.000Z",
      expiresAt: "2026-04-28T01:04:00.000Z",
      sessionId: createSessionId("session-2"),
    }
    const background: BackgroundTaskHandle = {
      version: 1,
      namespace: BACKGROUND_STATE_METADATA.namespace,
      handleId: createTaskId("background-1"),
      parentSessionId: createSessionId("session-1"),
      childSession: session,
      status: "running",
      createdAt: "2026-04-28T00:00:00.000Z",
      updatedAt: "2026-04-28T00:04:00.000Z",
      cancellation,
      resumeToken,
      evidenceIds: [createEvidenceId("evidence-1")],
    }
    const evidence: EvidenceReference = {
      version: 1,
      namespace: EVIDENCE_STATE_METADATA.namespace,
      evidenceId: createEvidenceId("evidence-1"),
      kind: "verification",
      summary: "bun test passed",
      createdAt: "2026-04-28T00:05:00.000Z",
      source: { type: "command", label: "bun test" },
    }

    expect(JSON.parse(serializeActiveWorkState(active))).toMatchObject({ version: 1 })
    expect(JSON.parse(serializeSessionRecord(session))).toMatchObject({ role: "executor" })
    expect(JSON.parse(serializeBackgroundTaskHandle(background))).toMatchObject({
      status: "running",
    })
    expect(JSON.parse(serializeEvidenceReference(evidence))).toMatchObject({
      kind: "verification",
    })
  })
})
