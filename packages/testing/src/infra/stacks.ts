/**
 * Local infrastructure stacks. All ports are bound to 127.0.0.1 only.
 * dev = `pnpm dev`, test = integration tests and E2E (separate project and ports).
 */
export type StackName = "dev" | "test";

export interface StackPorts {
  pg: number;
  valkey: number;
  gmSmtp: number;
  gmSmtps: number;
  gmImap: number;
  gmImaps: number;
  gmApi: number;
  mailpitSmtp: number;
  mailpitHttp: number;
  rspamd: number;
  rspamdController: number;
}

export interface StackDefinition {
  project: string;
  file: string;
  ports: StackPorts;
  /** Env variable names used by the compose file for each port. */
  portEnv: Record<keyof StackPorts, string>;
}

const portEnv = (prefix: string): Record<keyof StackPorts, string> => ({
  pg: `${prefix}_PG_PORT`,
  valkey: `${prefix}_VALKEY_PORT`,
  gmSmtp: `${prefix}_GM_SMTP_PORT`,
  gmSmtps: `${prefix}_GM_SMTPS_PORT`,
  gmImap: `${prefix}_GM_IMAP_PORT`,
  gmImaps: `${prefix}_GM_IMAPS_PORT`,
  gmApi: `${prefix}_GM_API_PORT`,
  mailpitSmtp: `${prefix}_MAILPIT_SMTP_PORT`,
  mailpitHttp: `${prefix}_MAILPIT_HTTP_PORT`,
  rspamd: `${prefix}_RSPAMD_PORT`,
  rspamdController: `${prefix}_RSPAMD_CONTROLLER_PORT`,
});

export const stacks: Record<StackName, StackDefinition> = {
  dev: {
    project: "emailplattform-dev",
    file: "infra/compose/dev.yml",
    ports: {
      pg: 54432,
      valkey: 54379,
      gmSmtp: 54025,
      gmSmtps: 54465,
      gmImap: 54143,
      gmImaps: 54993,
      gmApi: 54080,
      mailpitSmtp: 54102,
      mailpitHttp: 54825,
      rspamd: 54333,
      rspamdController: 54334,
    },
    portEnv: portEnv("DEV"),
  },
  test: {
    project: "emailplattform-test",
    file: "infra/compose/test.yml",
    ports: {
      pg: 55432,
      valkey: 55379,
      gmSmtp: 55025,
      gmSmtps: 55465,
      gmImap: 55143,
      gmImaps: 55993,
      gmApi: 55080,
      mailpitSmtp: 55102,
      mailpitHttp: 55825,
      rspamd: 55333,
      rspamdController: 55334,
    },
    portEnv: portEnv("TEST"),
  },
};

export const appPorts = {
  dev: { web: 4300, edge: 4301, worker: 4302 },
  e2e: { web: 4400, edge: 4401, worker: 4402 },
} as const;

export const testDatabasePassword = "test-only-password";
