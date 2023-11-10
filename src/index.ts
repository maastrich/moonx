import { cac } from "cac";
import { spawnSync } from "child_process";

import { help } from "./utils/help.js";
import { logger } from "./utils/logger.js";
import { scan } from "./utils/scan-moon.js";

const isMoonInstalledGlobally = spawnSync("which", ["moon"]).status === 0;

if (!isMoonInstalledGlobally) {
  logger.error(
    "Moon is not installed globally. Please install it with: proto install moon",
  );
}

const commands = await scan();

const cli = cac("moonx");

cli
  .command("_moonx_list [...items]", "List all available tasks")
  .action(([command, ...wss]) => {
    const workspaces = commands.get(command);

    if (!command) {
      return console.log(Array.from(commands.keys()).join("\n"));
    }
    if (!workspaces) {
      return;
    }
    if (wss.length > 0) {
      return console.log(
        workspaces.filter((ws) => !wss.includes(ws)).join("\n"),
      );
    }
    console.log(workspaces.join("\n"));
  });

for (const [name, workspaces] of commands) {
  cli
    .command(`${name} [...workspaces]`, "", { allowUnknownOptions: true })
    .usage(`${name} [...workspaces] [options]`)
    .action(async (wss: Array<string>, options) => {
      const args = ["moon", "run"];
      const rest = ["--", ...options["--"]];
      if (wss.length === 0) {
        return Bun.spawnSync({
          cmd: [args, `:${name}`, rest].flat(),
          stdout: "inherit",
          stderr: "inherit",
          stdin: "inherit",
          onExit(_, exitCode) {
            if (exitCode) {
              logger.error(`task ${name} failed`);
              process.exit(exitCode);
            }
          },
        });
      }
      wss = wss.filter((ws) => {
        if (!workspaces.includes(ws)) {
          logger.warn(`task ${name} does not exist on workspace ${ws}`);
          return false;
        }
        return true;
      });
      if (wss.length === 0) {
        return;
      }
      return Bun.spawnSync({
        cmd: [args, wss.map((ws) => `${name}:${ws}`), rest].flat(),
        stdout: "inherit",
        stderr: "inherit",
        stdin: "inherit",
        onExit(_, exitCode) {
          if (exitCode) {
            logger.error(`task ${name} failed`);
            process.exit(exitCode);
          }
        },
      });
    });
}

cli.help((sections) => {
  if (sections.some((section) => section.title === "Commands")) {
    return [{ body: help.moonx(Array.from(commands.keys())) }];
  }
  const usage = sections.find((section) => section.title === "Usage");
  if (!usage) {
    return [];
  }
  const [, command] =
    usage.body.match(/\$ moonx (.+) \[\.\.\.workspaces\] \[options\]/) ?? [];
  const workspaces = commands.get(command);
  if (!command || !workspaces) {
    return [];
  }
  return [{ body: help.task(workspaces) }];
});

try {
  cli.parse(Bun.argv, { run: false });
  await cli.runMatchedCommand();
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  }
  logger.error(String(error));
  process.exit(1);
}
