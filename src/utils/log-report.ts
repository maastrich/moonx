import type { RunReport } from "@moonrepo/types";

import { logger } from "./logger.js";

export async function logReport({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return;
  }
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
      !task.duration ? "unknown" : formatDuration(task.duration),
    ];
    logger.info(" " + parts.join(" "));
  }
}

function formatDuration(options: { secs: number; nanos: number }) {
  const totalMs = options.secs * 1e3 + options.nanos / 1e6;

  if (totalMs < 1000) return `${totalMs.toFixed(2)} ms`;
  if (totalMs < 60_000) return `${(totalMs / 1000).toFixed(2)} s`;

  const totalSec = totalMs / 1000;
  const minutes = Math.floor(totalSec / 60);
  const secondsRemainder = (totalSec % 60).toFixed(2);
  return `${minutes}m ${secondsRemainder}s`;
}
