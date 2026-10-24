import { runRetention } from "@ep/core/system/retention";
import type { QueueDefinition } from "./types";

export const maintenanceQueue: QueueDefinition = {
  queue: "maintenance",
  handlers: {
    retention: async (_job, ctx) => {
      const deleted = await runRetention(ctx.deps);
      ctx.logger.info({ deleted }, "retention finished");
      return deleted;
    },
  },
};
