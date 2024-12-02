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

  const maxTargetLength = Math.max(...tasks.map((task) => task.target.length));
  const maxStatusLength = Math.max(...tasks.map((task) => task.status.length));

  for (const task of tasks) {
    logger.debug(`maxTargetLength: ${maxTargetLength}`);
    logger.debug(`maxStatusLength: ${maxStatusLength}`);
    const parts = [
      task.target + " ".repeat(maxTargetLength + 4 - task.target.length),
      task.status + " ".repeat(maxStatusLength + 4 - task.status.length),
      !task.duration
        ? "unknown"
        : `${task.duration.secs ? `${task.duration.secs}s` : ""} ${
            task.duration.nanos ? `${task.duration.nanos / 1000000}ms` : ""
          }`,
    ];
    logger.info(parts.join(" "));
  }
}
