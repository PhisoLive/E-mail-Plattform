import { infraDown, infraUp } from "./lib/infra";
import type { StackName } from "./lib/stacks";

const [command = "up", stack = "dev", flag] = process.argv.slice(2);
if (stack !== "dev" && stack !== "test") throw new Error(`Unknown stack ${stack}`);

if (command === "up") {
  await infraUp(stack as StackName);
} else if (command === "down") {
  infraDown(stack as StackName, flag === "--volumes");
} else {
  throw new Error(`Unknown command ${command}`);
}
