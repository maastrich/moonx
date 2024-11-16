import type { Task } from "@moonrepo/types";

import { moon } from "./utils.js";

type QueryResult = {
  tasks: Record<string, Record<string, Task>>;
  options: object;
};

export async function scan() {
  const res = moon(["query", "tasks", "--json"], {
    stdout: "pipe",
    stderr: "inherit",
    stdin: "inherit",
  });

  const { tasks }: QueryResult = JSON.parse(res.stdout.toString());
  const projects = Object.entries(tasks).map(
    ([name, tasks]) => [name, Object.keys(tasks)] as const,
  );

  // Map<task, Array<project>>
  const commands = new Map<string, Array<string>>();

  for (const [name, tasks] of projects) {
    for (const task of tasks) {
      const command = commands.get(task) ?? [];
      command.push(name);
      commands.set(task, command);
    }
  }

  return commands;
}
