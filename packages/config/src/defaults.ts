/**
 * Central start values ("Startwerte") of the platform – concept chapter 25 (Anhang A).
 *
 * Rule from CLAUDE.md: limits, deadlines and thresholds come only from this file,
 * never hard-coded elsewhere. Workspaces may override selected values within safe
 * bounds (see `workspaceOverridable`).
 */

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO weekday, 1 = Monday

export interface SendingWindow {
  /** ISO weekdays on which sending is allowed. */
  days: readonly Weekday[];
  /** Local start time "HH:MM" in the recipient's time zone. */
  start: string;
  /** Local end time "HH:MM" (exclusive) in the recipient's time zone. */
  end: string;
  skipHolidays: boolean;
}

export interface RangeSeconds {
  min: number;
  max: number;
}

export interface RampProfile {
  start: number;
  increasePerBusinessDay: number;
  target: number;
  /** Cold outreach only allowed from this day of the ramp (1-based). */
  coldFromDay?: number;
}

const minutes = (m: number) => m * 60;

export const defaults = {
  workspace: {
    timezone: "Europe/Berlin",
    defaultLanguage: "de-DE",
    defaultFormality: "sie",
    countries: ["DE", "AT", "CH", "other"],
  },

  invitation: {
    /** Not specified in the concept – decision recorded in docs/ENTSCHEIDUNGEN.md. */
    expiresDays: 7,
    /** Invitation mails per workspace in 24 hours (protects the system sender, E-030). */
    maxPerWorkspacePerDay: 50,
  },

  sending: {
    window: {
      days: [1, 2, 3, 4, 5],
      start: "08:00",
      end: "17:00",
      skipHolidays: true,
    } satisfies SendingWindow,
    intervalCold: { min: minutes(3), max: minutes(8) } satisfies RangeSeconds,
    intervalWarm: { min: minutes(1), max: minutes(3) } satisfies RangeSeconds,
    replyDelay: { min: minutes(2), max: minutes(10) } satisfies RangeSeconds,
    maxPerRecipientDomainPerMailboxDay: 5,
    undoSeconds: 10,
  },

  scheduler: {
    tickSeconds: 15,
  },

  send: {
    timeoutSeconds: 60,
    retry: { attempts: 5, windowMinutes: 120 },
    uncertainCheckAfterMinutes: 2,
    /** Consecutive content rejections (5.7.x) that pause mailbox and campaign. */
    contentRejectionsToPause: 3,
  },

  limits: {
    /** Daily limit reduction after a provider limit error (−20 %). */
    adaptiveReduction: 0.2,
  },

  ramp: {
    profiles: {
      newCold: { start: 5, increasePerBusinessDay: 3, target: 40 },
      newWarm: { start: 20, increasePerBusinessDay: 10, target: 150 },
      establishedCold: { start: 20, increasePerBusinessDay: 5, target: 50 },
      establishedWarm: { start: 50, increasePerBusinessDay: 25, target: 300 },
      platformNewDomain: { start: 5, increasePerBusinessDay: 2, target: 30, coldFromDay: 15 },
    } satisfies Record<string, RampProfile>,
    minHealthToIncrease: 70,
    problemReduction: 0.3,
  },

  health: {
    windowDays: 7,
    /** Minimum sent mails before percentage-based pauses apply. */
    minSampleForPause: 50,
    bounce: { warn: 0.02, pause: 0.05 },
    complaint: { warn: 0.001, pause: 0.003 },
    unsubscribe: { warn: 0.01, pause: 0.03 },
    coldReplies: { warnBelow: 0.01, afterSent: 200 },
    providerErrors: { warnPerDay: 3, pauseConsecutive: 3 },
    weights: {
      hardBounces: 0.3,
      complaints: 0.25,
      coldReplies: 0.15,
      unsubscribes: 0.1,
      providerErrors: 0.1,
      authentication: 0.1,
    },
    colors: { green: 80, yellow: 50 },
  },

  campaign: {
    bouncePauseFirst100: 0.08,
    unsubscribePausePercent: 0.03,
    complaintPausePercent: 0.003,
  },

  preflight: {
    authRequiredFromRecipients: 100,
    inboxTestFromRecipients: 200,
    inboxTestMaxAgeDays: 7,
    sampleSize: 5,
    /** Share of near-identical mails that triggers the "mass mail" hint. */
    similarityHintShare: 0.9,
  },

  agent: {
    approvalThreshold: 25,
    run: { maxToolCalls: 25, maxMinutes: 10, maxCostCents: 50 },
    dailySendCap: 200,
    maxAutoRepliesPerThreadPerDay: 2,
    workingHours: { days: [1, 2, 3, 4, 5], start: "08:00", end: "18:00" },
    reportTime: "17:30",
  },

  approval: {
    expiresHours: 72,
  },

  ai: {
    classifyMinConfidence: 0.7,
    classifyMaxChars: 4000,
    streamUpTo: 20,
    batchFrom: { recipients: 500, startInMoreThanMinutes: 60 },
    knowledgeInlineMaxTokens: 50_000,
    budgetWarnPercent: 80,
    models: {
      premium: "claude-opus-5-5",
      standard: "claude-sonnet-5-5",
      economy: "claude-haiku-5-5",
    },
  },

  content: {
    rspamd: { yellow: 5, red: 8 },
    maxLinksCold: 3,
    attachmentsMaxMb: 10,
    words: {
      cold: { min: 60, max: 120 },
      followUp: { min: 30, max: 80 },
    },
  },

  sync: {
    intervalActiveMinutes: 2,
    intervalIdleMinutes: 10,
    initialDays: 30,
    maxImapConnectionsPerWorker: 50,
    /** Network failures within one hour before a mailbox goes to `error`. */
    networkFailuresToError: 5,
    tokenRefreshBeforeExpiryMinutes: 5,
  },

  threading: {
    subjectMatchDays: 30,
  },

  bounce: {
    softToSuppress: { count: 3, windowDays: 30 },
  },

  followUp: {
    oooDefaultDelayBusinessDays: 5,
  },

  import: {
    maxFileMb: 50,
    maxRows: 200_000,
    chunkSize: 1000,
  },

  trust: {
    new: { dailyCap: 200, maxMailboxes: 3 },
    restricted: { dailyCap: 20 },
    established: { daysWithoutPause: 30, maxBounceRate: 0.02 },
  },

  platformMailbox: {
    coldOutreachAfterDays: 14,
  },

  dns: {
    recheckUntilGreenHours: 6,
    recheckAfterGreenHours: 24,
  },

  notify: {
    emailBundleMinutes: 15,
  },

  voice: {
    maxSeconds: 180,
    retentionDays: 30,
  },

  inboxTest: {
    waitMinutes: 10,
  },

  graph: {
    maxMessageMb: 3,
  },

  provider: {
    capUsagePercent: 0.8,
    /** Daily recipient caps per provider (Anhang B), counted in a sliding 24 h window. */
    dailyRecipientCap: {
      gmail: 500,
      google_workspace: 2000,
      outlook_com: 300,
      microsoft_365: 10_000,
      default: 200,
    },
  },

  /** Deletion deadlines – concept chapter 17. `null` = unlimited. */
  retention: {
    mailContentMonths: 24,
    eventsMonths: 24,
    voiceDays: 30,
    importFilesDays: 30,
    appLogsDays: 30,
    disconnectedMailboxDays: 30,
    deletedWorkspaceDays: 30,
    backupsDays: 35,
    agentRunStepsMonths: 12,
    agentChatsMonths: 24,
    auditLogMonths: 36,
    clicksMonths: 12,
    inboxTestResultsMonths: 12,
    abuseCasesMonths: 36,
    suppressionHashes: null,
    /** Expired auth artefacts (sessions, verifications, invitations). */
    expiredAuthArtifactsDays: 30,
  },

  auth: {
    passwordMinLength: 10,
    passwordMaxLength: 128,
    nameMaxLength: 100,
    sessionDays: 30,
    sessionRefreshHours: 24,
    magicLinkMinutes: 5,
    verificationHours: 24,
    resetPasswordMinutes: 60,
    freshLoginMinutes: 15,
    require2faRoles: ["owner", "admin", "platform_admin"],
    rateLimit: {
      login: { max: 10, windowMinutes: 15 },
      passwordReset: { max: 3, windowMinutes: 60 },
      /** Fallback limit for all other auth endpoints. */
      general: { max: 100, windowSeconds: 60 },
    },
  },

  queues: {
    concurrency: {
      send: 20,
      schedule: 1,
      sync: 50,
      inbound: 20,
      ai: 10,
      import: 4,
      deliverability: 5,
      notify: 10,
      maintenance: 1,
    },
    attempts: {
      send: 1,
      schedule: 1,
      sync: 3,
      inbound: 3,
      ai: 2,
      import: 3,
      deliverability: 3,
      notify: 5,
      maintenance: 3,
    },
    backoffBaseMs: 2000,
    /** How long BullMQ keeps finished job data in Valkey (only ids, no contents). */
    keepCompletedSeconds: 24 * 3600,
    keepCompletedCount: 1000,
    keepFailedSeconds: 7 * 24 * 3600,
    /** Running jobs may finish on shutdown (concept chapter 18: at most 60 seconds). */
    shutdownGraceSeconds: 60,
  },

  schedules: {
    syncDispatcherSeconds: 60,
    batchPollSeconds: 60,
    tokenRefreshMinutes: 15,
    healthHourlyMinute: 7,
    dailyLimitsCron: "5 0 * * *",
    usageRollupCron: "0 2 * * *",
    retentionCron: "0 3 * * *",
    blocklistCron: "30 4 * * *",
    timezone: "Europe/Berlin",
  },

  live: {
    streamMinutes: 5,
    heartbeatSeconds: 25,
  },

  fetch: {
    maxBytes: 5 * 1024 * 1024,
    timeoutSeconds: 10,
    maxRedirects: 5,
  },

  logs: {
    retentionDays: 30,
  },
} as const;

export type Defaults = typeof defaults;
