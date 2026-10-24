import { checkHealth } from "@ep/core";
import { runtime } from "../../../server/runtime";

export async function GET(): Promise<Response> {
  const { core } = runtime();
  const report = await checkHealth(core.deps, core.redis);
  return Response.json(report, { status: report.status === "ok" ? 200 : 503 });
}
