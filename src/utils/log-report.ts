import type { RunReport } from "@moonrepo/types";

import { logger } from "./logger.js";

export async function logReport({ enabled }: { enabled: boolean }) {
  const report: RunReport = await Bun.file(".moon/cache/runReport.json").json();
  const tasks = report.actions
    .map((action) => {
      const node = action.node;
      if (node.action === "run-task") {
        return {
          target: node.params.target,
          duration: action.duration,
          id: node.params.id,
          status: action.status,
        };
      }
      return null;
    })
    .filter((task) => task !== null);

  for (const task of tasks) {
    const parts = [
      task.target + " ".repeat(30 - task.target.length),
      task.status + " ".repeat(20 - task.status.length),
      !task.duration
        ? "unknown"
        : `${task.duration.secs ? `${task.duration.secs}s` : ""} ${
            task.duration.nanos ? `${task.duration.nanos / 1000000}ms` : ""
          }`,
    ];
    logger.info(parts.join(" "));
  }
}
