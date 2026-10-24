import type { StackName } from "@ep/testing/infra";
import { infraDown, infraUp } from "@ep/testing/infra";

const [command = "up", stack = "dev", flag] = process.argv.slice(2);
if (stack !== "dev" && stack !== "test") throw new Error(`Unknown stack ${stack}`);

if (command === "up") {
  await infraUp(stack as StackName);
} else if (command === "down") {
  infraDown(stack as StackName, flag === "--volumes");
} else {
  throw new Error(`Unknown command ${command}`);
}
