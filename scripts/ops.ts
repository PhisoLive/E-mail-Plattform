/**
 * Operations commands:
 *   pnpm ops:rebuild-queues
 *   pnpm ops:set-trust <workspace-id|slug> <new|verified|established|restricted> "<reason>"
 */
import { baseEnvSchema, loadEnv } from "@ep/config/env";
import { createCoreRuntime } from "@ep/core/runtime";
import { rebuildQueues, setTrustLevel, type TrustLevel } from "@ep/core/system/operations";
import { loadRootEnv } from "./lib/env";

loadRootEnv();
const env = loadEnv(baseEnvSchema);
const runtime = createCoreRuntime(env, { applicationName: "emailplattform-ops", dbPoolSize: 2 });
const [command, ...args] = process.argv.slice(2);

try {
  if (command === "rebuild-queues") {
    console.info(await rebuildQueues(runtime.deps));
  } else if (command === "set-trust") {
    const [workspace, level, ...reason] = args;
    if (!workspace || !level)
      throw new Error('usage: pnpm ops:set-trust <workspace> <level> "<reason>"');
    console.info(
      await setTrustLevel(runtime.deps, workspace, level as TrustLevel, reason.join(" ")),
    );
  } else {
    throw new Error(`unknown command ${command}`);
  }
} finally {
  await runtime.close();
}
