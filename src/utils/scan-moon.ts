import type { Task } from "@moonrepo/types";

import { readCache, writeCache } from "./cache.js";
import { load } from "./load-yaml.js";
import { moon } from "./utils.js";

type QueryResult = {
  tasks: Record<string, Record<string, Task>>;
  options: object;
};

export async function scan(options?: { skipCache?: boolean }) {
  // Try to read from cache first unless skipCache is true
  if (!options?.skipCache) {
    const cached = await readCache();
    if (cached) {
      return cached;
    }
  }

  const moonxfig = await load<{
    "ignore-tasks": string[];
  }>("moonx.yml", {
    allowMissing: true,
    placeholder: {
      "ignore-tasks": [],
    },
  });

  const res = moon(["query", "tasks", "--json"], {
    stdout: "pipe",
    stderr: "inherit",
    stdin: "inherit",
  });

  const { tasks }: QueryResult = JSON.parse(res.stdout.toString());
  const projects = Object.entries(tasks).map(
    ([name, tasks]) => [name, Object.keys(tasks)] as const
  );

  // Map<task, Array<project>>
  const commands = new Map<string, Array<string>>();

  for (const [name, tasks] of projects) {
    for (const task of tasks) {
      if (moonxfig["ignore-tasks"].includes(task)) {
        continue;
      }
      const command = commands.get(task) ?? [];
      command.push(name);
      commands.set(task, command);
    }
  }

  // Write to cache
  writeCache(commands);

  return commands;
}
