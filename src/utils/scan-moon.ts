import {
  PartialProjectConfig,
  PartialWorkspaceConfig,
  PartialInheritedTasksConfig,
} from "@moonrepo/types";

import { glob } from "glob";
import { basename, join } from "path";

import { isWorkspaceProjectsConfig } from "./assertions.js";
import { load } from "./load-yaml.js";
import { logger } from "./logger.js";
import { mapFromGlob } from "./utils.js";

async function scanProjects(map: Map<string, string>) {
  const projects = new Map<string, PartialProjectConfig>();
  for (const [name, path] of map) {
    const project = await load<PartialProjectConfig>(join(path, "moon.yml"));
    if (!project) {
      logger.warn(`No project config found for ${name} at ${path}`);
      continue;
    }
    projects.set(name, project);
  }
  return projects;
}

async function scanWorkspace() {
  const workspace = await load<PartialWorkspaceConfig>(".moon/workspace.yml");
  if (!workspace) {
    throw new Error("No workspace config found");
  }
  const { projects } = workspace;
  const map = new Map<string, string>();
  if (!projects) {
    return scanProjects(map);
  }
  if (projects instanceof Array) {
    const files = await mapFromGlob(projects);
    for (const [name, path] of files) {
      map.set(name, path);
    }
  } else if (isWorkspaceProjectsConfig(projects)) {
    const files = await mapFromGlob(projects.globs ?? undefined);
    for (const [name, path] of files) {
      map.set(name, path);
    }
    for (const [name, path] of Object.entries(projects.sources ?? {})) {
      map.set(name, path);
    }
  } else {
    for (const [name, path] of Object.entries(projects)) {
      map.set(name, path);
    }
  }
  return scanProjects(map);
}

async function scanTaggedTasks() {
  const tags = new Map<string, PartialInheritedTasksConfig>();
  const files = await glob(".moon/tasks/tag-*.yml");
  for (const file of files) {
    const task = await load<PartialInheritedTasksConfig>(file);
    if (!task) {
      logger.warn(`Could not load tag from ${file}`);
      continue;
    }
    const tag = basename(file).replace(/^tag-(.+)\.yml$/, "$1");
    tags.set(tag, task);
  }
  return tags;
}

function mergeTasks(
  projectname: string,
  project: PartialProjectConfig,
  inherited: PartialInheritedTasksConfig,
  options: { ignoreWorkspaceFilters?: boolean } = {},
) {
  const { tasks } = inherited;
  if (!tasks) {
    return;
  }
  project.tasks ??= {};
  for (const [name, task] of Object.entries(tasks)) {
    if (project.tasks[name]) {
      logger.debug(
        `Task ${name} already defined in project ${projectname}, skip merging`,
      );
      continue;
    }
    const { workspace } = project;
    if (options.ignoreWorkspaceFilters || !workspace) {
      project.tasks[name] = task;
      continue;
    }
    const { inheritedTasks } = workspace;
    if (!inheritedTasks) {
      project.tasks[name] = task;
      continue;
    }
    const { include, exclude, rename } = inheritedTasks;
    if (include && !include.includes(name)) {
      continue;
    }
    if (exclude && exclude.includes(name)) {
      continue;
    }
    if (rename && name in rename) {
      project.tasks[rename[name]] = task;
      continue;
    }
    project.tasks[name] = task;
  }
}

export async function scan() {
  const tasks =
    (await load<PartialInheritedTasksConfig>(".moon/tasks.yml")) ?? {};
  const taggedTasks = await scanTaggedTasks();
  const workspaces = await scanWorkspace();

  for (const [name, workspace] of workspaces) {
    mergeTasks(name, workspace, tasks);
  }
  for (const [name, project] of workspaces) {
    const { tags } = project;
    if (!tags) {
      continue;
    }
    for (const tag of tags) {
      const inherited = taggedTasks.get(tag);
      if (!inherited) {
        logger.warn(`Tag ${tag} not found for project ${name}`);
        continue;
      }
      mergeTasks(name, project, inherited, {
        ignoreWorkspaceFilters: true,
      });
    }
  }
  const commands = new Map<string, Array<string>>();
  for (const [name, project] of workspaces) {
    for (const task in project.tasks) {
      const command = commands.get(task) ?? [];
      command.push(name);
      commands.set(task, command);
    }
  }
  return commands;
}
